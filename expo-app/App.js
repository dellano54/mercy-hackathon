import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator, Animated, Image } from 'react-native';
import { Audio } from 'expo-av';
import { Shield, Phone, PhoneOff, Mic, MicOff, Volume2, User, AlertTriangle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const BACKEND_URL = 'ws://YOUR_COMPUTER_IP:8000/ws/caller';

export default function App() {
  const [recording, setRecording] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [status, setStatus] = useState('READY TO HELP');
  const [ws, setWs] = useState(null);
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (isCalling) {
      // Start call timer
      timerRef.current = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      clearInterval(timerRef.current);
      setCallTimer(0);
      pulseAnim.setValue(1);
    }
    return () => clearInterval(timerRef.current);
  }, [isCalling]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  async function startCall() {
    try {
      setStatus('CONNECTING TO AEGIS...');
      // Note: Replace with your actual local IP
      const socket = new WebSocket(BACKEND_URL);
      
      socket.onopen = async () => {
        setWs(socket);
        setIsCalling(true);
        setStatus('AEGIS ACTIVE');
        await startRecording(socket);
      };

      socket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'incident_confirmed') {
          setStatus('AEGIS: INCIDENT LOGGED');
        }
      };

      socket.onerror = (e) => setStatus('CONNECTION ERROR');
      socket.onclose = () => endCall();

    } catch (err) {
      console.error('Failed to start call', err);
      setStatus('FAILED TO CONNECT');
    }
  }

  async function startRecording(socket) {
    try {
      const { status: permissionStatus } = await Audio.requestPermissionsAsync();
      if (permissionStatus !== 'granted') {
        setStatus('MIC PERMISSION DENIED');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      
      // Simulate sending initial context
      socket.send(JSON.stringify({
        type: 'start_incident',
        location: 'Main Street',
        description: 'Auto-detection active. Analyzing voice pattern...'
      }));

    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function endCall() {
    setIsCalling(false);
    setStatus('CALL TERMINATED');
    if (recording) {
      await recording.stopAndUnloadAsync();
      setRecording(null);
    }
    if (ws) ws.close();
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#020617', '#000000']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Shield size={20} color="#0ea5e9" />
            <Text style={styles.headerTitle}>PROJECT AEGIS</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.dot, { backgroundColor: isCalling ? '#ef4444' : '#10b981' }]} />
            <Text style={styles.encryptedText}>SECURE LINE</Text>
          </View>
        </View>

        {/* Main Call View */}
        <View style={styles.callContent}>
          <View style={styles.avatarContainer}>
            <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                {isCalling ? (
                  <ActivityIndicator size="large" color="#0ea5e9" />
                ) : (
                  <Shield size={60} color="#1e293b" />
                )}
              </View>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.statusText}>{status}</Text>
            {isCalling && (
              <Text style={styles.timerText}>{formatTime(callTimer)}</Text>
            )}
          </View>

          {isCalling && (
            <View style={styles.incidentPreview}>
              <View style={styles.incidentBadge}>
                <AlertTriangle size={14} color="#f59e0b" />
                <Text style={styles.incidentText}>AUTO-TRIAGE ACTIVE</Text>
              </View>
              <Text style={styles.locationHint}>Detecting location via GPS...</Text>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          {!isCalling ? (
            <TouchableOpacity style={styles.initiateButton} onPress={startCall}>
              <Phone size={32} color="white" fill="white" />
              <Text style={styles.initiateText}>REPORT EMERGENCY</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeControls}>
              <View style={styles.secondaryControls}>
                <TouchableOpacity 
                  style={[styles.smallControl, isMuted && styles.activeSmallControl]} 
                  onPress={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <MicOff size={24} color="white" /> : <Mic size={24} color="white" />}
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.smallControl}>
                  <Volume2 size={24} color="white" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
                <PhoneOff size={32} color="white" fill="white" />
              </TouchableOpacity>
              
              <Text style={styles.endCallLabel}>END DISPATCH</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerInfo}>AUTHORIZED PERSONNEL ONLY // AEGIS-OS v2.1</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  encryptedText: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  callContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  pulseCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
  },
  avatarWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#334155',
    padding: 10,
    backgroundColor: '#020617',
  },
  avatarCircle: {
    flex: 1,
    borderRadius: 60,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  infoContainer: {
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  timerText: {
    color: 'white',
    fontSize: 48,
    fontWeight: '200',
    fontFamily: 'monospace',
  },
  incidentPreview: {
    marginTop: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.05)',
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.1)',
  },
  incidentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  incidentText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  locationHint: {
    color: '#64748b',
    fontSize: 12,
  },
  controlsContainer: {
    paddingBottom: 60,
    paddingHorizontal: 40,
  },
  initiateButton: {
    backgroundColor: '#ef4444',
    height: 80,
    borderRadius: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  initiateText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  activeControls: {
    alignItems: 'center',
    gap: 30,
  },
  secondaryControls: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 10,
  },
  smallControl: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeSmallControl: {
    backgroundColor: '#334155',
  },
  endCallButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  endCallLabel: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  footer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerInfo: {
    color: '#334155',
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
});
