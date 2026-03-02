export interface ClassInfo {
    code: string;
    name: string;
    lecTutLab: number;  // 0 = lecture, 1 = tutorial, 2 = lab
    instructor: string;
    roomCode: string;
    buildingId: string;
    dayOfWeek: [number];
    startTime: string;
    endTime: string;
    location: string;
}