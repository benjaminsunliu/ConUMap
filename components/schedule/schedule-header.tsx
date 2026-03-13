import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

interface ScheduleHeaderProps {
    currentWeekStart: Date;
    onWeekChange: (newWeekStart: Date) => void;
    onTodayPress: () => void;
    onSettingsPress: () => void;
}

const MONTHS =[
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
]

export default function ScheduleHeader({
    currentWeekStart,
    onWeekChange,
    onTodayPress,
    onSettingsPress
}: ScheduleHeaderProps) {
    const colorScheme = useColorScheme() ?? "light";
    const theme = Colors[colorScheme];

    const [monthPickerVisible, setMonthPickerVisible] = useState(false);

    const month = currentWeekStart.getMonth();
    const year = currentWeekStart.getFullYear();

    function handleMonthSelect(selectedMonth: number) {
        const firstOfMonth = new Date(year, selectedMonth, 1);                  // Locate first day of month
        firstOfMonth.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());   // Rewind to the closest Sunday before this date
        onWeekChange(firstOfMonth);
        setMonthPickerVisible(false);
    }

    return(
        <View style={[styles.container, {backgroundColor: theme.background, shadowColor: theme.scheduleHeader.shadowColor}]}>
            <View style={styles.titleRow}>
                <Text style={[styles.title, {color: theme.tint}]}>Class Schedule</Text>
            </View>

            <View style={styles.controlsRow}>
                <View style={styles.monthButtonContainer}>
                    <Pressable
                        onPress={() => setMonthPickerVisible(true)}
                        style={[styles.monthButton]}
                        accessibilityLabel='Change month'
                    >
                        <Text style={[styles.monthButtonText, {color: theme.scheduleHeader.buttonText}]}>{MONTHS[month]} {year}</Text>
                        <MaterialIcons name="arrow-drop-down" size={20} color={theme.scheduleHeader.buttonText} />
                    </Pressable>
                </View>

                <View style={styles.todayButtonContainer}>
                    <Pressable onPress={onTodayPress} style={[styles.todayButton, {backgroundColor: theme.icon, borderColor: theme.icon}]} accessibilityLabel='Jump to today'>
                        <Text style={[styles.todayButtonText, {color: theme.scheduleHeader.todayButtonText}]}>Today</Text>
                    </Pressable>
                </View>
            </View>

            <Modal
                visible={monthPickerVisible}
                transparent
                animationType='fade'
                onRequestClose={() => setMonthPickerVisible(false)}
            >
                <View style={[styles.backdrop, {backgroundColor: theme.scheduleHeader.monthPickerBackdrop}]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setMonthPickerVisible(false)} />
                    <View style={[styles.monthMenu, {backgroundColor: theme.scheduleHeader.monthPickerBackground, shadowColor: theme.scheduleHeader.shadowColor}]}>
                        {MONTHS.map((name, index) => (
                            <Pressable
                                key={name}
                                onPress={() => handleMonthSelect(index)}
                                style={[styles.monthMenuItem, index === month && {backgroundColor: theme.scheduleHeader.monthMenuItemActive}]}
                            >
                                <Text style={[styles.monthMenuItemText, {color: theme.scheduleHeader.buttonText}, index === month && styles.monthMenuItemTextActive && {color: theme.scheduleHeader.monthMenuTextActive}]}>
                                    {name}
                                </Text>
                                
                            </Pressable>
                        ))}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 12,
        paddingBottom: 10,
        paddingHorizontal: 16,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',  // centers the title horizontally
        marginBottom: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.3,
    },

    // Row with month picker and today button
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    monthButtonContainer: {
        flex: 3,
        alignItems: 'center',
        paddingRight: 5

    },
    monthButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
    },
    monthButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    todayButtonContainer: {
        flex: 2,
        alignItems: 'flex-start',
        paddingLeft: 20,
    },
    todayButton: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    todayButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },

    // Month picker
    backdrop: {
        flex: 1,
        justifyContent: 'flex-start',
        paddingTop: 100,
        paddingHorizontal: 16,
    },
    monthMenu: {
        borderRadius: 12,
        paddingVertical: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    monthMenuItem: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    monthMenuItemText: {
        fontSize: 16,
    },
    monthMenuItemTextActive: {
        fontWeight: '600',
    }
});