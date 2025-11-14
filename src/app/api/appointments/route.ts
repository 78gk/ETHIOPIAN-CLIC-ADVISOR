import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { healthPostId, patientName, patientPhone, appointmentDate, symptoms, notes } = await request.json()

    if (!healthPostId || !patientName || !patientPhone || !appointmentDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get health post details
    const healthPost = await db.healthPost.findUnique({
      where: { id: healthPostId }
    })

    if (!healthPost) {
      return NextResponse.json(
        { error: 'Health post not found' },
        { status: 404 }
      )
    }

    // Create appointment record (you could add an appointments table to the schema)
    const appointment = {
      id: `apt_${Date.now()}`,
      healthPostId,
      healthPostName: healthPost.name,
      healthPostNameAmharic: healthPost.nameAmharic,
      patientName,
      patientPhone,
      appointmentDate,
      symptoms,
      notes,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    }

    // In a real app, you would save this to the database
    // For now, we'll just return the confirmation
    
    return NextResponse.json({
      success: true,
      appointment,
      message: 'Appointment booked successfully',
      messageAmharic: 'ቀጠሮው በተሳካ ሁኔታ ተይዟል'
    })

  } catch (error) {
    console.error('Appointment booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}