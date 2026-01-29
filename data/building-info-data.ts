export type CampusId = "SGW" | "LOYOLA";

export type Building = {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  contactInfo: string;
  campus: CampusId;
};

export const buildings: Building[] = [
  {
    id: "H",
    name: "Hall Building",
    description: "Engineering & Computer Science",
    latitude: 45.4971,
    longitude: -73.5792,
    openingHours: "7:00 AM – 11:00 PM",
    contactInfo: "hall@concordia.ca",
    campus: "SGW",
  },
  {
    id: "EV",
    name: "EV Building",
    description: "Library & Study Spaces",
    latitude: 45.4959,
    longitude: -73.5786,
    openingHours: "24/7",
    contactInfo: "library@concordia.ca",
    campus: "SGW",
  },
];
