import { db } from '../src/lib/db'

const healthPosts = [
  {
    name: 'Addis Ababa General Hospital',
    nameAmharic: 'አዲስ አበባ አጠቃላይ ሆስፒታል',
    address: 'Bole Road, Addis Ababa',
    addressAmharic: 'ቦሌ መንገድ፣ አዲስ አበባ',
    phone: '+251 11 123 4567',
    latitude: 9.0096,
    longitude: 38.7629,
    city: 'Addis Ababa',
    region: 'Addis Ababa',
    operatingHours: '24/7 Emergency, 8:00-17:00 Outpatient',
    services: JSON.stringify(['Emergency Care', 'General Medicine', 'Pediatrics', 'Maternity', 'Laboratory', 'Pharmacy']),
    isActive: true
  },
  {
    name: 'Mekelle Health Center',
    nameAmharic: 'መቀሌ የህክምና ማዕከል',
    address: 'Mekelle City Center',
    addressAmharic: 'መቀሌ ከተማ ማዕከል',
    phone: '+251 34 441 2345',
    latitude: 13.4967,
    longitude: 39.4736,
    city: 'Mekelle',
    region: 'Tigray',
    operatingHours: '8:00-18:00',
    services: JSON.stringify(['General Medicine', 'Maternal Health', 'Vaccination', 'Family Planning']),
    isActive: true
  },
  {
    name: 'Gondar Health Post',
    nameAmharic: 'ጎንደር የህክምና ጣቢያ',
    address: 'Gondar Town',
    addressAmharic: 'ጎንደር ከተማ',
    phone: '+251 58 111 2345',
    latitude: 12.6030,
    longitude: 37.4678,
    city: 'Gondar',
    region: 'Amhara',
    operatingHours: '8:30-17:30',
    services: JSON.stringify(['Primary Care', 'Malaria Treatment', 'Nutrition Support', 'Health Education']),
    isActive: true
  },
  {
    name: 'Jimma Medical Center',
    nameAmharic: 'ጂማ ሕክምና ማዕከል',
    address: 'Jimma City',
    addressAmharic: 'ጂማ ከተማ',
    phone: '+251 47 111 6789',
    latitude: 7.6726,
    longitude: 36.8344,
    city: 'Jimma',
    region: 'Oromia',
    operatingHours: '24/7 Emergency, 8:00-20:00 General',
    services: JSON.stringify(['Emergency', 'Surgery', 'Internal Medicine', 'Pediatrics', 'Dental']),
    isActive: true
  },
  {
    name: 'Bahir Dar Health Center',
    nameAmharic: 'ባህር ዳር የህክምና ማዕከል',
    address: 'Near Lake Tana',
    addressAmharic: 'ከታና ሀይቅ አጠገብ',
    phone: '+251 58 222 3456',
    latitude: 11.5946,
    longitude: 37.3858,
    city: 'Bahir Dar',
    region: 'Amhara',
    operatingHours: '8:00-18:00',
    services: JSON.stringify(['General Medicine', 'Maternal Health', 'Child Health', 'HIV/AIDS Services']),
    isActive: true
  },
  {
    name: 'Hawassa Referral Hospital',
    nameAmharic: 'ሀዋሳ የምርመራ ሆስፒታል',
    address: 'Hawassa City',
    addressAmharic: 'ሀዋሳ ከተማ',
    phone: '+251 46 221 1234',
    latitude: 7.0603,
    longitude: 38.4766,
    city: 'Hawassa',
    region: 'Sidama',
    operatingHours: '24/7',
    services: JSON.stringify(['Emergency', 'Specialist Care', 'Surgery', 'Mental Health', 'Rehabilitation']),
    isActive: true
  },
  {
    name: 'Dire Dawa Health Post',
    nameAmharic: 'ድሬዳዋ የህክምና ጣቢያ',
    address: 'Dire Dawa City',
    addressAmharic: 'ድሬዳዋ ከተማ',
    phone: '+251 25 112 3456',
    latitude: 9.5931,
    longitude: 41.8641,
    city: 'Dire Dawa',
    region: 'Dire Dawa',
    operatingHours: '8:00-17:00',
    services: JSON.stringify(['Primary Care', 'Vaccination', 'Family Planning', 'Health Education']),
    isActive: true
  },
  {
    name: 'Adama Medical Center',
    nameAmharic: 'አዳማ ሕክምና ማዕከል',
    address: 'Adama City Center',
    addressAmharic: 'አዳማ ከተማ ማዕከል',
    phone: '+251 22 111 7890',
    latitude: 8.5436,
    longitude: 39.2667,
    city: 'Adama',
    region: 'Oromia',
    operatingHours: '8:00-20:00',
    services: JSON.stringify(['Emergency', 'General Medicine', 'Pediatrics', 'Laboratory', 'X-ray']),
    isActive: true
  }
]

async function seedHealthPosts() {
  console.log('Seeding health posts...')
  
  try {
    for (const post of healthPosts) {
      await db.healthPost.create({
        data: post
      })
    }
    
    console.log('Health posts seeded successfully!')
  } catch (error) {
    console.error('Error seeding health posts:', error)
  }
}

seedHealthPosts()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))