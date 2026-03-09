import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { timeToPixels } from '@/constants/scheduleConstant';
import { ClassInfo } from '@/types/calendarTypes';

interface ClassBlockProps {
    classInfo: ClassInfo;
    colorMap: Map<string, string>
    onPress: (ClassInfo: ClassInfo) => void;
}

export default function ClassBlock({ classInfo, colorMap, onPress }: ClassBlockProps) {
    const topOffset = timeToPixels(`${classInfo.START_HOURS}:${classInfo.START_MINUTES}`);
    const height = timeToPixels(`${classInfo.END_HOURS}:${classInfo.END_MINUTES}`) - topOffset;

    const courseKey = `${classInfo.SUBJECT}-${classInfo.CATALOG_NBR}`
    const color = colorMap.get(courseKey) ?? "#707070";

    return (
        <Pressable
            onPress={() => onPress(classInfo)}
            style={({ pressed }) => [
                styles.block,
                {
                    top: topOffset,
                    height,
                    backgroundColor: color,
                    opacity: pressed ? 0.8 : 1,
                },
            ]}
        >
            <View style={styles.content}>
                <Text style={styles.courseName} numberOfLines={1}>
                    {classInfo.SUBJECT}
                </Text>
                <Text style={styles.courseName} numberOfLines={1}>
                    {classInfo.CATALOG_NBR}
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    block: {
        position: 'absolute',
        left: 1,
        right: 1,
        borderRadius: 4,
        flexDirection: 'row',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
    },
    content: {
        flex: 1,
        paddingHorizontal: 3,
        paddingVertical: 2,
        justifyContent: 'center',
    },
    courseName: {
        color: '#fdfcea',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.2,
        textAlign: 'center'
    },
    time: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 9,
        marginTop: 1,
    }
})