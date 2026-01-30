export type CampusId = "SGW" | "LOYOLA";

export type Building = {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  email: string;
  phone: string;
  address: string;
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
    email: "hall@concordia.ca",
    phone: "",
    address: "123 tree avenue",
    campus: "SGW",
  },
  {
    id: "EV",
    name: "EV Building",
    description: "Library & Study Spaces",
    latitude: 45.4959,
    longitude: -73.5786,
    openingHours: "24/7",
    email: "library@concordia.ca",
    phone: "514-111-1111",
    address: "123 tree avenue",
    campus: "SGW",
  }
]