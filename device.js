// Device Identification & Management System
class DeviceManager {
    constructor() {
        this.DEVICE_ID_KEY = 'xiecchuot_device_id';
        this.DEVICE_NAME_KEY = 'xiecchuot_device_name';
        this.initializeDevice();
    }

    initializeDevice() {
        // Check if device ID exists in localStorage
        if (!localStorage.getItem(this.DEVICE_ID_KEY)) {
            this.generateNewDevice();
        }
    }

    generateNewDevice() {
        const deviceId = this.createDeviceFingerprint();
        const deviceName = this.getDeviceName();
        
        localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
        localStorage.setItem(this.DEVICE_NAME_KEY, deviceName);
    }

    createDeviceFingerprint() {
        // Create a unique fingerprint based on browser and device info
        const components = [
            navigator.userAgent,
            navigator.language,
            new Date().getTimezoneOffset(),
            screen.width + 'x' + screen.height,
            navigator.hardwareConcurrency,
            Math.random().toString(36).substr(2, 9) // Add randomness for uniqueness
        ];
        
        let hash = 0;
        const fingerprint = components.join('|');
        
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
    }

    getDeviceName() {
        // Detect device type and OS
        const ua = navigator.userAgent;
        let deviceType = 'Unknown Device';
        let os = 'Unknown OS';

        // Detect OS
        if (ua.indexOf('Win') > -1) os = 'Windows';
        if (ua.indexOf('Mac') > -1) os = 'macOS';
        if (ua.indexOf('Linux') > -1) os = 'Linux';
        if (ua.indexOf('Android') > -1) os = 'Android';
        if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';

        // Detect browser
        let browser = 'Unknown Browser';
        if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
        if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
        if (ua.indexOf('Safari') > -1) browser = 'Safari';
        if (ua.indexOf('Edge') > -1) browser = 'Edge';

        deviceType = `${os} - ${browser}`;
        return deviceType;
    }

    getDeviceId() {
        return localStorage.getItem(this.DEVICE_ID_KEY) || '';
    }

    getDeviceName() {
        return localStorage.getItem(this.DEVICE_NAME_KEY) || 'Unknown Device';
    }

    // Clear device ID (for testing purposes)
    resetDevice() {
        localStorage.removeItem(this.DEVICE_ID_KEY);
        localStorage.removeItem(this.DEVICE_NAME_KEY);
        this.initializeDevice();
    }
}

// Initialize device manager globally
const deviceManager = new DeviceManager();
