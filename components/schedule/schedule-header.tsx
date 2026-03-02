import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

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
    const [monthPickerVisible, setMonthPickerVisible] = useState(false);

    const month = currentWeekStart.getMonth();
    const year = currentWeekStart.getFullYear();

    function handleMonthSelect(selectedMonth: number) {
        const newDate = new Date(year, selectedMonth, 8);
        newDate.setDate(newDate.getDate() - newDate.getDay());
        onWeekChange(newDate);
        setMonthPickerVisible(false);
    }

    return(
        <View style={styles.container}>
            <View style={styles.titleRow}>
                <Pressable onPress={onSettingsPress} style={styles.settingsButton} accessibilityLabel='Settings'>
                    <MaterialIcons name="density-medium" size={24} color="#fdfcea" />
                </Pressable>
                <Text style={styles.title}>Class Schedule</Text>
            </View>

            <View style={styles.controlsRow}>
                <View style={styles.monthButtonContainer}>
                    <Pressable
                        onPress={() => setMonthPickerVisible(true)}
                        style={styles.monthButton}
                        accessibilityLabel='Change month'
                    >
                        <Text style={styles.monthButtonText}>{MONTHS[month]} {year}</Text>
                        <MaterialIcons name="arrow-drop-down" size={20} color="#fdfcea" />
                    </Pressable>
                </View>

                <View style={styles.todayButtonContainer}>
                    <Pressable onPress={onTodayPress} style={styles.todayButton} accessibilityLabel='Jump to today'>
                        <Text style={styles.todayButtonText}>Today</Text>
                    </Pressable>
                </View>
            </View>

            <Modal
                visible={monthPickerVisible}
                transparent
                animationType='fade'
                onRequestClose={() => setMonthPickerVisible(false)}
            >
                <View style={styles.backdrop}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setMonthPickerVisible(false)} />
                    <View style={styles.monthMenu}>
                        {MONTHS.map((name, index) => (
                            <Pressable
                                key={name}
                                onPress={() => handleMonthSelect(index)}
                                style={[styles.monthMenuItem, index === month && styles.monthMenuItemActive]}
                            >
                                <Text style={[styles.monthMenuItemText, index === month && styles.monthMenuItemTextActive]}>
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
        backgroundColor: '#5e0e16',
        paddingTop: 12,
        paddingBottom: 10,
        paddingHorizontal: 16,
        shadowColor: '#000',
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
    settingsButton: {
        position: 'absolute', // taken out of flex flow so title stays centered
        left: 0,
        padding: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fdfcea',
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
        color: '#fdfcea',
    },
    todayButtonContainer: {
        flex: 2,
        alignItems: 'flex-start',
        paddingLeft: 20,
    },
    todayButton: {
        backgroundColor: '#fdfcea',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#fdfcea',
    },
    todayButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000000',
    },

    // Month picker
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-start',
        paddingTop: 100,
        paddingHorizontal: 16,
    },
    monthMenu: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    monthMenuItem: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    monthMenuItemActive: {
        backgroundColor: '#EBF2FD',
    },
    monthMenuItemText: {
        fontSize: 16,
        color: '#333',
    },
    monthMenuItemTextActive: {
        color: '#1A73E8',
        fontWeight: '600',
    }
});