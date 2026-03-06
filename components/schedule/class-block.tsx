import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { timeToPixels } from './constants';
import { ClassInfo } from './types';

interface ClassBlockProps {
    classInfo: ClassInfo;
    onPress: (ClassInfo: ClassInfo) => void;
}

export default function ClassBlock({ classInfo, onPress }: ClassBlockProps) {
    const topOffset = timeToPixels(`${classInfo.START_HOURS}:${classInfo.START_MINUTES}`);
    const height = timeToPixels(`${classInfo.END_HOURS}:${classInfo.END_MINUTES}`) - topOffset;
    
    const classColor = "#4597f4";

    return (
        <Pressable
            onPress={() => onPress(classInfo)}
            style={({ pressed }) => [
                styles.block,
                {
                    top: topOffset,
                    height,
                    backgroundColor: classColor,
                    opacity: pressed ? 0.8 : 1,
                },
            ]}
        >
            <View style={[styles.accentBar, {backgroundColor: darkenColor(classColor, 30) }]}/>
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

function darkenColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
    const b = Math.max(0, (num & 0xFF) - amount);
    return `rgb(${r}, ${g}, ${b})`;
}

function formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
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
    accentBar: {
        width: 0,
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