export type CampusId = "SGW" | "LOYOLA";

export type Building = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    phone: string;
    address: string;
    website: string;
    campus: CampusId;
    openingHours: Array<string>;
    accessibility: Array<string>;
  };

export const buildings: Building[] = [
  {
      id: "H",
      name: "Henry F. Hall Building",
      latitude: 45.4971,
      longitude: -73.5792,
      openingHours: [
        "7:00 AM – 11:00 PM",
        "7:00 AM – 11:00 PM",
        "7:00 AM – 11:00 PM",
        "7:00 AM – 11:00 PM",
        "7:00 AM – 11:00 PM",
        "7:00 AM – 9:00 PM",
        "7:00 AM – 9:00 PM"
    ],
      phone: "514-848-2424",
      address: "1455 De Maisonneuve Blvd. W.",
      website: "https://www.concordia.ca/maps/buildings/h.html",
      campus: "SGW",
      accessibility: [
          "Accessible entrance",
          "Accessible building elevator"
      ]
  },
  {
      id: "EV",
      name: "Engineering, Computer Science and Visual Arts Integrated Complex",
      latitude: 45.4959,
      longitude: -73.5786,
      openingHours: [
          "7:00 AM – 11:00 PM",
          "7:00 AM – 11:00 PM",
          "7:00 AM – 11:00 PM",
          "7:00 AM – 11:00 PM",
          "7:00 AM – 11:00 PM",
          "7:00 AM – 9:00 PM",
          "7:00 AM – 9:00 PM"
      ],
      phone: "514-848-3600",
      address: "1515 Ste-Catherine St. W.",
      website: "https://www.concordia.ca/maps/buildings/ev.html",
      campus: "SGW",
      accessibility: [
          "Accessible entrance",
          "Accessible building elevator"
      ]
  }
]