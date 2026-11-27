/**
 * The owners and the two teams shown on the About page, as the owner of this
 * project named them (2026-11-27). The pictures are from their LinkedIn
 * profiles, set on FaceCloud's orange. Valentyn P. is the main owner.
 *
 * Used by the About page and by src/lib/structuredData.ts (Person data).
 * Plain data only: the Vite config imports this file in Node.
 */

export interface Person {
  name: string
  role: string
  title: string
  place: string
  /** A picture in public/team, or '' for initials on orange. */
  photo: string
  linkedin: string
  main?: boolean
}

export const OWNERS: Person[] = [
  {
    name: 'Valentyn P.', role: 'Founder & Owner', title: '', place: 'Greater Sacramento, United States',
    photo: '/team/valentyn-p.jpg', linkedin: 'https://www.linkedin.com/in/vpodk/', main: true,
  },
  {
    name: 'Muhammad Asif', role: 'Co-Owner', title: 'CEO, Datamart', place: 'Lahore, Pakistan',
    photo: '/team/muhammad-asif.jpg', linkedin: 'https://www.linkedin.com/in/asif4347/', main: false,
  },
]

export const TEAMS: { name: string; people: Person[] }[] = [
  {
    name: 'Development Team',
    people: [
      { name: 'Ali Hassan', role: 'Frontend & UI/UX Lead', title: 'Web app, design system and user experience', place: 'Lahore, Pakistan', photo: '/team/ali-hassan.jpg', linkedin: 'https://www.linkedin.com/in/alihassankhandev/' },
      { name: 'Ijaz Ahmad', role: 'Backend Engineer', title: 'APIs, database and the processing pipeline', place: 'Lahore, Pakistan', photo: '/team/ijaz-ahmad.jpg', linkedin: 'https://www.linkedin.com/in/ijaz-ahmad-0a5004285/' },
      { name: 'Vaneeza Sohaib', role: 'Computer Vision Engineer', title: 'Face detection, quality checks and enhancement models', place: 'Lahore, Pakistan', photo: '', linkedin: 'https://www.linkedin.com/in/vaneeza-sohaib-836a18372/' },
    ],
  },
  {
    name: 'Marketing Team',
    people: [
      { name: 'Kamal Ahmad', role: 'Head of Marketing', title: 'Brand, search and growth', place: 'Lahore, Pakistan', photo: '/team/kamal-ahmad.jpg', linkedin: 'https://www.linkedin.com/in/kamal-ahmad-rana/' },
      { name: 'Athar Ammar', role: 'Business Development Manager', title: 'New clients, outreach and digital growth', place: 'Los Angeles, United States', photo: '/team/athar-ammar.jpg', linkedin: 'https://www.linkedin.com/in/atharammar/' },
      { name: 'Ali Awan', role: 'Head of Sales', title: 'Partnerships and customer accounts', place: 'Lahore, Pakistan', photo: '/team/ali-awan.jpg', linkedin: 'https://www.linkedin.com/in/aliawan512/' },
    ],
  },
]

/** Alt text for a person's picture: who they are and what they do here. */
export const personAlt = (person: Person) => `${person.name}, ${person.role} at FaceCloud`
