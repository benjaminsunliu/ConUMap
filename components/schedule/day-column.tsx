import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ClassBlock from './class-block';
import { COLUMN_TOTAL_HEIGHT } from './constants';
import { ClassInfo } from './types';


interface DayColumnProps {
    dayIndex: number;
    classes: ClassInfo[];
    onClassPress: (classInfo: ClassInfo) => void;
}

export default function DayColumn({ dayIndex, classes, onClassPress }: DayColumnProps) {
    return (
        <View style={styles.column}>
            <View style={[styles.eventsArea, { height: COLUMN_TOTAL_HEIGHT}]}>
               {classes.map((cls) => (
                    <ClassBlock 
                        key={`${dayIndex}-${cls.subject}-${cls.catalogNumber}`}
                        classInfo={cls}
                        onPress={onClassPress}/>
                ))}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    column: {
        flex: 1,
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderLeftColor: "#E0E0E0"
    },
    eventsArea: {
        position: "relative",
    }
})