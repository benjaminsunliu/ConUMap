import { timeToPixels } from "@/constants/scheduleConstant";

describe('timeToPixels', () => {
    it('selects roundStartTimeToSlot or roundEndTimeToSlot', () => {
        const time1 = "14:08";
        const time2 = "14:12";

        const startPixels = timeToPixels(time1, "start");
        const endPixels = timeToPixels(time2, "end");

        expect(startPixels).toEqual(588);
        expect(endPixels).toEqual(598.5);
    });

    it('functions when startOrEnd is omitted or invalid', () => {
        const time = "14:10";

        // Should default to "start" in both cases
        const startPixels = timeToPixels(time);
        const startPixels2 = timeToPixels(time, "beginning"); 

        expect(startPixels).toEqual(588);
        expect(startPixels2).toEqual(588);
    });

    it('works for slot-aligned minutes', () => {
        const time1 = "15:00";
        const time2 = "15:30";

        const startPixels = timeToPixels(time1, "start");
        const endPixels = timeToPixels(time2, "end"); 

        expect(startPixels).toEqual(630);
        expect(endPixels).toEqual(651);
    });
})