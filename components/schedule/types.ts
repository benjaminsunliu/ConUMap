export interface ClassInfo {
    code: string;
    name: string;
    lecTutLab: number;  // 0 = lecture, 1 = tutorial, 2 = lab
    section: string;
    instructor: string;
    roomCode: string;
    buildingId: string;
    dayOfWeek: number[];
    startTime: string;
    endTime: string;
}