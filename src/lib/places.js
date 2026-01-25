// Seed data for Shillong attractions/places
export const SHILLONG_PLACES = [
  { id: 'elephant-falls', name: 'Elephant Falls', description: 'A beautiful three-tiered waterfall surrounded by lush greenery' },
  { id: 'shillong-peak', name: 'Shillong Peak', description: 'The highest point in Shillong offering panoramic views' },
  { id: 'umiam-lake', name: 'Umiam Lake', description: 'A serene man-made lake perfect for boating and water sports' },
  { id: 'don-bosco-museum', name: 'Don Bosco Museum', description: 'A cultural museum showcasing the heritage of Northeast India' },
  { id: 'laitlum-canyons', name: 'Laitlum Canyons', description: 'Breathtaking canyons with stunning views of the valleys' },
  { id: 'dawki', name: 'Dawki', description: 'Crystal clear river and the famous suspension bridge' },
  { id: 'cherrapunji', name: 'Cherrapunji', description: 'One of the wettest places on earth with beautiful waterfalls' },
  { id: 'living-root-bridge', name: 'Living Root Bridge', description: 'Natural bridges formed by tree roots' },
  { id: 'mawlynnong', name: 'Mawlynnong', description: 'Asia\'s cleanest village with beautiful landscapes' },
  { id: 'nohkalikai-falls', name: 'Nohkalikai Falls', description: 'The tallest plunge waterfall in India' }
]

export function getPlaceById(id) {
  return SHILLONG_PLACES.find(place => place.id === id)
}

export function getPlaceNames(ids) {
  return ids.map(id => {
    const place = getPlaceById(id)
    return place ? place.name : id
  })
}
