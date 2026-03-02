import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { ClassInfo } from "./types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface ClassDetailPopupProps {
    classInfo: ClassInfo;
    onClose: () => void;
}

export default function ClassDetailPopup({classInfo, onClose}: ClassDetailPopupProps) {
    const navigation = useNavigation<any>();

    function handleLocateOnMap() {
        onClose();
        navigation.navigate('Map', {
            buildingId: classInfo.buildingId,
            buildingName: classInfo.location,
        })
    }

    return (
        <Modal visible transparent animationType='slide' onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.card}>
                    <View style={styles.body}>
                        <View style={styles.headerRow}>
                            <View style={styles.headerText}>
                                <Text style={styles.courseCode}>{classInfo.code}</Text>
                                <Text style={styles.lecTutLab}>{classInfo.lecTutLab}</Text>
                            </View>
                            <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Close">
                                <MaterialIcons name="close" color="#fff" />;
                            </Pressable>
                        </View>
                        <View style={styles.details}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailRowTitle}>Professor:</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailRowTitle}>Time:</Text>
                                <Text style={styles.detailRowText}>14:45 – 16:00 (Tue, Thu)</Text>
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
                            accessibilityLabel={`Find ${classInfo.location} on map`}
                        >
                            <Text style={styles.mapButtonText}>Open Directions in Map</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end', // anchors the card to the bottom
    },
    card: {
        backgroundColor: '#5a2328',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
        // Shadow above the card
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    body: {

    },
    headerRow: {

    },
    headerText: {

    },
    courseCode: {

    },
    lecTutLab: {

    },
    closeButton: {

    },
    details:{

    },
    detailRow: {

    },
    detailRowTitle: {

    },
    detailRowText: {

    },
    mapButton: {

    },
    mapButtonText: {

    }
})