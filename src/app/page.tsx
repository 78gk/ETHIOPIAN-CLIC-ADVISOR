'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, MapPin, Phone, Clock, AlertTriangle, CheckCircle, Search, Navigation, Calendar, History, Filter } from 'lucide-react'
import { toast } from 'sonner'

interface Symptom {
  id: string
  amharic: string
  english: string
  category: string
  urgency: 'low' | 'medium' | 'high' | 'emergency'
}

interface HealthPost {
  id: string
  name: string
  nameAmharic: string
  address: string
  addressAmharic: string
  phone: string
  distance: number
  hours: string
  services: string[]
  latitude: number
  longitude: number
  city: string
  region: string
  rating?: number
  isOpen?: boolean
}

interface UserLocation {
  lat: number
  lng: number
  accuracy?: number
}

interface TriageHistory {
  id: string
  symptoms: string[]
  urgency: string
  date: string
  healthPost?: string
}

const symptoms: Symptom[] = [
  { id: 'fever', amharic: 'ትኩሳት', english: 'Fever', category: 'general', urgency: 'medium' },
  { id: 'cough', amharic: 'መተማመን', english: 'Cough', category: 'respiratory', urgency: 'low' },
  { id: 'headache', amharic: 'ራስ ማቅለሽ', english: 'Headache', category: 'neurological', urgency: 'medium' },
  { id: 'stomach_pain', amharic: 'የሆድ ክብደት', english: 'Stomach pain', category: 'digestive', urgency: 'medium' },
  { id: 'diarrhea', amharic: 'የሆድ ተቅማጥ', english: 'Diarrhea', category: 'digestive', urgency: 'medium' },
  { id: 'vomiting', amharic: 'ማለቂያ', english: 'Vomiting', category: 'digestive', urgency: 'medium' },
  { id: 'chest_pain', amharic: 'የእግር ክብደት', english: 'Chest pain', category: 'cardiac', urgency: 'emergency' },
  { id: 'breathing_difficulty', amharic: 'የመተማመን ክብደት', english: 'Breathing difficulty', category: 'respiratory', urgency: 'emergency' },
  { id: 'dizziness', amharic: 'ማስታወቂያ', english: 'Dizziness', category: 'neurological', urgency: 'medium' },
  { id: 'fatigue', amharic: 'ድካም', english: 'Fatigue', category: 'general', urgency: 'low' },
  { id: 'loss_of_taste', amharic: 'ጣዕም መጣ', english: 'Loss of taste/smell', category: 'neurological', urgency: 'medium' },
  { id: 'sore_throat', amharic: '��ጉሮሮ ክብደት', english: 'Sore throat', category: 'respiratory', urgency: 'low' },
  { id: 'body_aches', amharic: 'የሰዉነት ክብደት', english: 'Body aches', category: 'general', urgency: 'medium' },
  { id: 'rash', amharic: 'የቆዳ ክብደት', english: 'Rash', category: 'skin', urgency: 'low' },
  { id: 'injury', amharic: 'የሰዉነት ጉዳት', english: 'Injury', category: 'trauma', urgency: 'high' }
]

export default function Home() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [results, setResults] = useState<{
    urgency: 'low' | 'medium' | 'high' | 'emergency'
    recommendations: HealthPost[]
    message: string
    messageAmharic: string
  } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedService, setSelectedService] = useState('all')
  const [showHistory, setShowHistory] = useState(false)
  const [triageHistory, setTriageHistory] = useState<TriageHistory[]>([])
  const [filteredPosts, setFilteredPosts] = useState<HealthPost[]>([])
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [selectedHealthPost, setSelectedHealthPost] = useState<HealthPost | null>(null)
  const [appointmentForm, setAppointmentForm] = useState({
    patientName: '',
    patientPhone: '',
    appointmentDate: '',
    notes: ''
  })
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load triage history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('triageHistory')
    if (savedHistory) {
      setTriageHistory(JSON.parse(savedHistory))
    }

    // Cache health posts for offline use
    const cachedPosts = localStorage.getItem('healthPosts')
    if (cachedPosts) {
      const parsed = JSON.parse(cachedPosts)
      if (parsed.length > 0) {
        setResults(prev => prev ? {
          ...prev,
          recommendations: parsed
        } : null)
      }
    }
  }, [])

  // Get user location on mount
  useEffect(() => {
    getUserLocation()
  }, [])

  // Filter health posts based on search and filters
  useEffect(() => {
    if (results?.recommendations) {
      let filtered = results.recommendations

      if (searchQuery) {
        filtered = filtered.filter(post => 
          post.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.nameAmharic.includes(searchQuery) ||
          post.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.address.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }

      if (selectedRegion !== 'all') {
        filtered = filtered.filter(post => post.region === selectedRegion)
      }

      if (selectedService !== 'all') {
        filtered = filtered.filter(post => 
          post.services.some(service => 
            service.toLowerCase().includes(selectedService.toLowerCase())
          )
        )
      }

      setFilteredPosts(filtered)
    } else {
      setFilteredPosts([])
    }
  }, [results, searchQuery, selectedRegion, selectedService])

  const getUserLocation = async () => {
    if (!('geolocation' in navigator)) {
      toast.error('የአካባቢ አገናኝ አይደለም / Geolocation not supported')
      return
    }

    setIsGettingLocation(true)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { timeout: 10000, enableHighAccuracy: true }
        )
      })

      const location: UserLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      }

      setUserLocation(location)
      toast.success(`አካባቢ ተገኝቷል / Location found (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`)
    } catch (error) {
      console.error('Location error:', error)
      toast.error('አካባቢ ማግኘት አልተቻለም / Could not get location')
    } finally {
      setIsGettingLocation(false)
    }
  }

  const callHealthPost = (phone: string, name: string) => {
    if ('tel' in window) {
      window.location.href = `tel:${phone}`
      toast.success(`ወደ ${name} በመደወል ላይ / Calling ${name}`)
    } else {
      toast.error(`የስልክ ተግባር አይደለም / Phone not available. Please call: ${phone}`)
    }
  }

  const openMaps = (post: HealthPost) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${post.latitude},${post.longitude}`
    window.open(url, '_blank')
    toast.success(`ወደ ${post.name} ካርታ በመክፈት ላይ / Opening map to ${post.name}`)
  }

  const saveToHistory = (symptoms: string[], urgency: string, healthPostName?: string) => {
    const newEntry: TriageHistory = {
      id: Date.now().toString(),
      symptoms,
      urgency,
      date: new Date().toISOString(),
      healthPost: healthPostName
    }

    const updatedHistory = [newEntry, ...triageHistory].slice(0, 10) // Keep last 10
    setTriageHistory(updatedHistory)
    localStorage.setItem('triageHistory', JSON.stringify(updatedHistory))
  }

  const bookAppointment = async (healthPost: HealthPost) => {
    setSelectedHealthPost(healthPost)
    setShowAppointmentModal(true)
  }

  const submitAppointment = async () => {
    if (!selectedHealthPost || !appointmentForm.patientName || !appointmentForm.patientPhone || !appointmentForm.appointmentDate) {
      toast.error('እባክዎ እቅዱን ይሙሉ / Please fill all required fields')
      return
    }

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          healthPostId: selectedHealthPost.id,
          patientName: appointmentForm.patientName,
          patientPhone: appointmentForm.patientPhone,
          appointmentDate: appointmentForm.appointmentDate,
          symptoms: selectedSymptoms,
          notes: appointmentForm.notes
        })
      })

      if (!response.ok) throw new Error('Booking failed')

      const data = await response.json()
      toast.success(data.messageAmharic || data.message)
      
      // Reset form
      setAppointmentForm({
        patientName: '',
        patientPhone: '',
        appointmentDate: '',
        notes: ''
      })
      setShowAppointmentModal(false)
      setSelectedHealthPost(null)

    } catch (error) {
      toast.error('ቀጠሮ መያዝ አልተቻለም / Could not book appointment')
    }
  }

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    )
  }

  const analyzeSymptoms = async () => {
    if (selectedSymptoms.length === 0) {
      toast.error('እባክዎ በይኖቹ ውስጥ የሚገኙትን የስኳር ውህዶችን ይምረጡ')
      return
    }

    setIsAnalyzing(true)
    
    try {
      if (!isOnline) {
        // Offline fallback - use cached data or basic triage
        const cachedPosts = localStorage.getItem('healthPosts')
        let recommendations = []
        
        if (cachedPosts) {
          recommendations = JSON.parse(cachedPosts)
        } else {
          // Basic emergency triage logic for offline
          toast.warning('በመረጃ ማግኛው ውጪ - መሰረታዊ ትሪይጅ ብቻ / Offline - Basic triage only')
          
          if (selectedSymptoms.includes('chest_pain') || selectedSymptoms.includes('breathing_difficulty')) {
            toast.error('ይህ የህክምና አደጋ ነው! ወዲያውድ ወደ ቅርብ ሆስፒታል ይሂዱ!')
            return
          }
        }

        const urgency = selectedSymptoms.includes('injury') ? 'high' : 
                       selectedSymptoms.includes('chest_pain') || selectedSymptoms.includes('breathing_difficulty') ? 'emergency' :
                       selectedSymptoms.length > 3 ? 'medium' : 'low'

        const mockData = {
          urgency,
          recommendations,
          message: urgency === 'emergency' ? 'EMERGENCY: Seek immediate medical attention!' : 'Please visit a health facility for evaluation.',
          messageAmharic: urgency === 'emergency' ? 'አደጋ: ወዲያውድ የህክምና እርዳታ ይፈልጉ!' : 'እባክዎ ለምርመራ የህክምና ተቋም ይጎብኙ።'
        }

        setResults(mockData)
        saveToHistory(selectedSymptoms, urgency, recommendations[0]?.name)
        toast.success('በመረጃ ማግኛው ውጪ ትሪይጅ ተጠናቋል / Offline triage completed')
        return
      }

      // Online analysis
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: selectedSymptoms, userLocation })
      })

      if (!response.ok) throw new Error('Analysis failed')
      
      const data = await response.json()
      setResults(data)
      
      // Save to history
      saveToHistory(selectedSymptoms, data.urgency, data.recommendations[0]?.name)
      
      // Cache health posts for offline use
      localStorage.setItem('healthPosts', JSON.stringify(data.recommendations))
      
      if (data.urgency === 'emergency') {
        toast.error('ይህ የህክምና አደጋ ነው! ወዲያውድ ወደ ቅርብ ሆስፒታል ይሂዱ!')
      } else {
        toast.success('ትሪይጅ ተጠናቋል')
      }
    } catch (error) {
      toast.error('ችግር አለ፣ እባክዎ ደግመው ይሞክሩ')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-black'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return <AlertTriangle className="w-5 h-5" />
      case 'high': return <AlertTriangle className="w-5 h-5" />
      case 'medium': return <Clock className="w-5 h-5" />
      case 'low': return <CheckCircle className="w-5 h-5" />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/clinic-logo.png"
              alt="Mobile Clinic Triage Logo"
              className="w-20 h-20 md:w-24 md:h-24 object-contain"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-green-800 mb-2">
            ሞባይል ክሊኒክ ትሪይጅ
          </h1>
          <p className="text-lg text-green-600">
            Mobile Clinic Triage - የስኳር መመርመሪያ
          </p>
          
          {/* Location Status */}
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={getUserLocation}
              disabled={isGettingLocation}
              className="text-sm"
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  በመፈለግ ላይ...
                </>
              ) : userLocation ? (
                <>
                  <MapPin className="w-4 h-4 mr-2 text-green-600" />
                  አካባቢ: {userLocation.lat.toFixed(2)}, {userLocation.lng.toFixed(2)}
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  አካባቢ ይውሰዱ
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-2 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm"
          >
            <History className="w-4 h-4 mr-2" />
            {showHistory ? 'ዝጋ' : 'ታሪክ'} History
          </Button>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-600">
              {isOnline ? 'Online' : 'Offline - በመረጃ ማግኛው ውጪ'}
            </span>
          </div>
        </div>

        {/* History Section */}
        {showHistory && triageHistory.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-green-800">
                <History className="w-5 h-5 inline mr-2" />
                የትሪይጅ ታሪክ / Triage History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {triageHistory.map((entry) => (
                  <div key={entry.id} className="border rounded p-3 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-gray-600">
                          {entry.symptoms.length} symptom(s) - {entry.urgency}
                        </p>
                        {entry.healthPost && (
                          <p className="text-green-600">📍 {entry.healthPost}</p>
                        )}
                      </div>
                      <Badge variant={entry.urgency === 'emergency' ? 'destructive' : 'secondary'}>
                        {entry.urgency}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Symptom Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-green-800">
              እባክዎ የሚገኙዎትን የስኳር ውህዶችን ይምረጡ
              <br />
              <span className="text-sm text-gray-600">
                Please select your symptoms
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {symptoms.map(symptom => (
                <Button
                  key={symptom.id}
                  variant={selectedSymptoms.includes(symptom.id) ? "default" : "outline"}
                  className={`h-auto p-3 text-left flex flex-col items-start ${
                    selectedSymptoms.includes(symptom.id) 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'hover:bg-green-50'
                  }`}
                  onClick={() => toggleSymptom(symptom.id)}
                >
                  <span className="font-semibold text-sm">{symptom.amharic}</span>
                  <span className="text-xs opacity-75">{symptom.english}</span>
                </Button>
              ))}
            </div>
            
            <div className="mt-6 flex justify-center">
              <Button
                onClick={analyzeSymptoms}
                disabled={isAnalyzing || selectedSymptoms.length === 0}
                className="bg-green-600 hover:bg-green-700 px-8 py-3 text-lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    በመመርመር ላይ...
                  </>
                ) : (
                  'ስኳር ተመርምር / Analyze Symptoms'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Urgency Alert */}
            <Alert className={`border-2 ${getUrgencyColor(results.urgency)}`}>
              <div className="flex items-center gap-2">
                {getUrgencyIcon(results.urgency)}
                <div>
                  <AlertDescription className="text-lg font-semibold">
                    {results.messageAmharic}
                  </AlertDescription>
                  <AlertDescription className="text-sm opacity-90 mt-1">
                    {results.message}
                  </AlertDescription>
                </div>
              </div>
            </Alert>

            {/* Health Post Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-green-800">
                  የቅርብ ህክምና ጣቢያዎች / Nearest Health Posts
                </CardTitle>
                
                {/* Search and Filters */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="የህክምና ጣቢያ ይፈልጉ... / Search health posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="ክልል / Region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ሁሉም ክልሎች / All Regions</SelectItem>
                        <SelectItem value="Addis Ababa">አዲስ አበባ</SelectItem>
                        <SelectItem value="Tigray">ትግራይ</SelectItem>
                        <SelectItem value="Amhara">አማራ</SelectItem>
                        <SelectItem value="Oromia">ኦሮሚያ</SelectItem>
                        <SelectItem value="Sidama">ሲዳማ</SelectItem>
                        <SelectItem value="Dire Dawa">ድሬዳዋ</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="አገልግሎት / Service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ሁሉም አገልግሎቶች / All Services</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                        <SelectItem value="Surgery">Surgery</SelectItem>
                        <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                        <SelectItem value="Maternity">Maternity</SelectItem>
                        <SelectItem value="Laboratory">Laboratory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {filteredPosts.length !== results.recommendations.length && (
                    <p className="text-sm text-gray-600">
                      {filteredPosts.length} of {results.recommendations.length} health posts shown
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(filteredPosts.length > 0 ? filteredPosts : results.recommendations).map((post, index) => (
                    <div key={post.id} className="border rounded-lg p-4 hover:bg-green-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg text-green-800">
                            {index + 1}. {post.nameAmharic}
                          </h3>
                          <p className="text-sm text-gray-600">{post.name}</p>
                          <p className="text-gray-600 mt-1">{post.addressAmharic}</p>
                          <p className="text-sm text-gray-500">{post.address}</p>
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {post.distance.toFixed(1)} ኪሎሜትር
                        </Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mt-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-green-600" />
                          <span>{post.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span>{post.hours}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-gray-700 mb-1">አገልግሎቶች:</p>
                        <div className="flex flex-wrap gap-1">
                          {post.services.map((service, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex gap-2 flex-wrap">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => openMaps(post)}
                        >
                          <MapPin className="w-4 h-4 mr-1" />
                          ካርታ ላይ ይመልከቱ
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => callHealthPost(post.phone, post.name)}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          ይደውሉ
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => bookAppointment(post)}
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          ቀጠሮ ይያዙ
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Emergency Info */}
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <h3 className="font-bold text-red-800 mb-1">የአደጋ ጥሪ ቁጥር</h3>
              <div className="flex justify-center gap-4 mb-3">
                <Button 
                  size="lg" 
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-4"
                  onClick={() => callHealthPost('911', 'Emergency Services')}
                >
                  <Phone className="w-5 h-5 mr-2" />
                  911 - ወዲያውድ ይደውሉ
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                በአደጋ ጊዜ ይደውሉ / Call in emergency
              </p>
              <div className="mt-4 text-xs text-gray-500">
                <p>Available 24/7 - ለ24 ሰዓት</p>
                <p>Ambulance, Police, Fire - አምቡላንስ፣ ፖሊስ፣ እሳት አጋዥ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Booking Modal */}
        {showAppointmentModal && selectedHealthPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-green-800">
                  <Calendar className="w-5 h-5 inline mr-2" />
                  ቀጠሮ መያዝ / Book Appointment
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {selectedHealthPost.nameAmharic} / {selectedHealthPost.name}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">ስም / Name *</label>
                  <Input
                    value={appointmentForm.patientName}
                    onChange={(e) => setAppointmentForm(prev => ({...prev, patientName: e.target.value}))}
                    placeholder="ሙሉ ስምዎን ያስገቡ / Enter full name"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">ስልክ / Phone *</label>
                  <Input
                    value={appointmentForm.patientPhone}
                    onChange={(e) => setAppointmentForm(prev => ({...prev, patientPhone: e.target.value}))}
                    placeholder="+251 9X XXX XXXX"
                    type="tel"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">ቀን / Date *</label>
                  <Input
                    value={appointmentForm.appointmentDate}
                    onChange={(e) => setAppointmentForm(prev => ({...prev, appointmentDate: e.target.value}))}
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">ማስታወሻ / Notes</label>
                  <textarea
                    value={appointmentForm.notes}
                    onChange={(e) => setAppointmentForm(prev => ({...prev, notes: e.target.value}))}
                    className="w-full p-2 border rounded-md text-sm"
                    rows={3}
                    placeholder="ተጨማሪ መረጃ... / Additional information..."
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={submitAppointment}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    ቀጠሮውን ያስገቡ / Book
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowAppointmentModal(false)
                      setSelectedHealthPost(null)
                      setAppointmentForm({
                        patientName: '',
                        patientPhone: '',
                        appointmentDate: '',
                        notes: ''
                      })
                    }}
                  >
                    ይቅር / Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}