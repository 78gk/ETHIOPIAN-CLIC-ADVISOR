import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface SymptomAnalysis {
  urgency: 'low' | 'medium' | 'high' | 'emergency'
  message: string
  messageAmharic: string
}

const symptomUrgencyRules: Record<string, 'low' | 'medium' | 'high' | 'emergency'> = {
  'fever': 'medium',
  'cough': 'low',
  'headache': 'medium',
  'stomach_pain': 'medium',
  'diarrhea': 'medium',
  'vomiting': 'medium',
  'chest_pain': 'emergency',
  'breathing_difficulty': 'emergency',
  'dizziness': 'medium',
  'fatigue': 'low',
  'loss_of_taste': 'medium',
  'sore_throat': 'low',
  'body_aches': 'medium',
  'rash': 'low',
  'injury': 'high'
}

const urgencyMessages: Record<string, { english: string; amharic: string }> = {
  'emergency': {
    english: 'EMERGENCY: Seek immediate medical attention! Go to the nearest hospital emergency room.',
    amharic: 'አደጋ: ወዲያውድ የህክምና እርዳታ ይፈልጉ! ወደ ቅርብ ሆስፒታል ይሂዱ።'
  },
  'high': {
    english: 'HIGH PRIORITY: Please visit a health facility within 4-6 hours.',
    amharic: 'ከፍተኛ ቅድሚያ: እባክዎ በ4-6 ሰዓታት ውስጥ የህክምና ተቋም ይጎብኙ።'
  },
  'medium': {
    english: 'MODERATE: Visit a health post within 24 hours for evaluation.',
    amharic: 'መካከለኛ: ለምርመራ በ24 ሰዓታት ውስጥ የህክምና ጣቢያ ይጎብኙ።'
  },
  'low': {
    english: 'LOW PRIORITY: Monitor symptoms and visit a health post if they persist or worsen.',
    amharic: 'ዝቅተኛ ቅድሚያ: ምልክቶችን ይቆጣጠሩ እና እንደ ተቀጡ ወይም አደገዙ የህክምና ጣቢያ ይጎብኙ።'
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function analyzeSymptoms(symptoms: string[]): SymptomAnalysis {
  if (symptoms.includes('chest_pain') || symptoms.includes('breathing_difficulty')) {
    return {
      urgency: 'emergency',
      message: urgencyMessages.emergency.english,
      messageAmharic: urgencyMessages.emergency.amharic
    }
  }

  if (symptoms.includes('injury')) {
    return {
      urgency: 'high',
      message: urgencyMessages.high.english,
      messageAmharic: urgencyMessages.high.amharic
    }
  }

  const urgencyScores = symptoms.map(symptom => {
    const urgency = symptomUrgencyRules[symptom] || 'low'
    switch (urgency) {
      case 'emergency': return 4
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
      default: return 1
    }
  })

  const avgScore = urgencyScores.reduce((a, b) => a + b, 0) / urgencyScores.length
  
  if (avgScore >= 3.5) {
    return {
      urgency: 'high',
      message: urgencyMessages.high.english,
      messageAmharic: urgencyMessages.high.amharic
    }
  } else if (avgScore >= 2.5) {
    return {
      urgency: 'medium',
      message: urgencyMessages.medium.english,
      messageAmharic: urgencyMessages.medium.amharic
    }
  } else {
    return {
      urgency: 'low',
      message: urgencyMessages.low.english,
      messageAmharic: urgencyMessages.low.amharic
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { symptoms, userLocation } = await request.json()

    if (!symptoms || !Array.isArray(symptoms)) {
      return NextResponse.json(
        { error: 'Invalid symptoms data' },
        { status: 400 }
      )
    }

    // Analyze symptoms
    const analysis = analyzeSymptoms(symptoms)

    // Get health posts from database
    const healthPosts = await db.healthPost.findMany({
      where: { isActive: true }
    })

    // If user location is provided, calculate distances and sort
    let recommendations = healthPosts.map(post => ({
      id: post.id,
      name: post.name,
      nameAmharic: post.nameAmharic,
      address: post.address,
      addressAmharic: post.addressAmharic,
      phone: post.phone,
      latitude: post.latitude,
      longitude: post.longitude,
      city: post.city,
      region: post.region,
      distance: userLocation ? 
        calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          post.latitude, 
          post.longitude
        ) : Math.random() * 20, // Random distance if no location
      hours: post.operatingHours,
      services: JSON.parse(post.services || '[]'),
      rating: 4.0 + Math.random(), // Random rating for demo
      isOpen: new Date().getHours() >= 8 && new Date().getHours() <= 17 // Check if open
    }))

    // Sort by distance
    recommendations.sort((a, b) => a.distance - b.distance)

    // Take top 3-5 recommendations
    recommendations = recommendations.slice(0, 5)

    // Log the triage request
    await db.triageLog.create({
      data: {
        symptoms: JSON.stringify(symptoms),
        urgency: analysis.urgency,
        recommendedHealthPostId: recommendations[0]?.id,
        userLocation: userLocation ? JSON.stringify(userLocation) : null
      }
    })

    return NextResponse.json({
      urgency: analysis.urgency,
      message: analysis.message,
      messageAmharic: analysis.messageAmharic,
      recommendations
    })

  } catch (error) {
    console.error('Triage analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}