import React, { useState, useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { ClassInfo } from "./types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface ClassDetailPopupProps {
    classInfo: ClassInfo;
    onClose: () => void;
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ClassDetailPopup({classInfo, onClose}: ClassDetailPopupProps) {
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, []);

    const navigation = useNavigation<any>();

    function handleClose() {
        Animated.timing(backdropOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => onClose());
    }

    function handleLocateOnMap() {
        onClose();
        navigation.navigate('Map', {
            buildingId: classInfo.buildingId,
            buildingName: classInfo.buildingId,
        })
    }

    function resolveWeekdays(c: ClassInfo): string {
        let result: string = "";

        c.dayOfWeek.forEach((n) => {result += (WEEK_DAYS[n] + ", ")})

        return result.slice(0, -2);
    }

    return (
        <Modal visible transparent animationType='none' onRequestClose={handleClose}>
            <Animated.View style={[styles.backdrop, {opacity: backdropOpacity}]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
                <Pressable style={styles.card}>
                    <View style={styles.body}>
                        <View style={styles.headerRow}>
                            <View style={styles.headerText}>
                                <Text style={styles.courseCode}>{classInfo.subject} {classInfo.catalogNumber}</Text>
                                <Text style={styles.lecTutLab}>{classInfo.lecTutLab} – Section {classInfo.classSection}</Text>
                            </View>
                            <Pressable onPress={handleClose} style={styles.closeButton} accessibilityLabel="Close">
                                <MaterialIcons name="close" size={36} color="#fff" />
                            </Pressable>
                        </View>
                        <View style={styles.details}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailRowTitle}>Instructor:</Text>
                                <Text style={styles.detailRowText}>{classInfo.instructor}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailRowTitle}>Time:</Text>
                                <Text style={styles.detailRowText}>{classInfo.startHours}:{classInfo.startMinutes} – {classInfo.endHours}:{classInfo.endMinutes} ({resolveWeekdays(classInfo)})</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailRowTitle}>Location:</Text>
                                <Text style={styles.detailRowText}>Room H501</Text>
                                <Text style={styles.detailRowText}>Hall Building</Text>
                                <Text style={styles.detailRowText}>SGW Campus</Text>
                            </View>
                        </View>
                        <Pressable
                            onPress={handleLocateOnMap}
                            style={({ pressed }) => [styles.mapButton, {opacity: pressed ? 0.85 : 1}]}
                            accessibilityLabel={`Find ${classInfo.buildingId} ${classInfo.roomCode} on map`}
                        >
                            <Text style={styles.mapButtonText}>Open Directions in Map</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: '#5e0e16',
        borderRadius: 18,
        maxHeight: '75%',
        overflow: 'hidden', 
        // Shadow above the card
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
        alignSelf: 'stretch'
    },
    body: {
        padding: 20,
        paddingBottom: 36, // extra bottom padding for home indicator on modern phones
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    headerText: {
        flex: 1,
        marginRight: 12,
        marginBottom: 18,
    },
    courseCode: {
        fontSize: 32,
        fontWeight: '700',
        color: '#fdfcea',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 3,
    },
    lecTutLab: {
        fontSize: 20,
        color: '#fdfcea'
    },
    closeButton: {
        width: 38,
        height: 38,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    details:{
        marginBottom: 4
    },
    detailRow: {
        marginBottom: 26,
    },
    detailRowTitle: {
        fontWeight: 700,
        fontSize: 20,
        color: "#fdfcea",
        marginBottom:10
    },
    detailRowText: {
        fontSize: 16,
        color: '#fdfcea',
        marginBottom: 6
    },
    mapButton: {
        backgroundColor: '#fdfcea',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    mapButtonText: {
        color: '#000000',
        fontSize: 18,
        fontWeight: '700',
    }
})