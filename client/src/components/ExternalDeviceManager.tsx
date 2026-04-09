import React, { useState } from 'react';
import { Bluetooth, Usb, Plus, Trash2, Smartphone, HardDrive, Search, Printer, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDevices } from '@/contexts/DeviceContext';
import { motion, AnimatePresence } from 'framer-motion';

const ExternalDeviceManager: React.FC = () => {
  const { connectedDevices, connectUSBDevice, connectBluetoothDevice, disconnectDevice, isUSBSupported, isBluetoothSupported } = useDevices();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (connection: 'usb' | 'bluetooth', type: 'scanner' | 'printer') => {
    setIsConnecting(true);
    try {
      if (connection === 'usb') {
        await connectUSBDevice(type);
      } else {
        await connectBluetoothDevice(type);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2 dark:text-white">
            <Search className="w-5 h-5 text-[#FF8882]" />
            Connect New Device
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Pair your external scanner or printer via USB or Bluetooth.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Scan className="w-4 h-4" /> External Scanner
            </h4>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleConnect('usb', 'scanner')} 
                disabled={!isUSBSupported || isConnecting}
                variant="outline"
                className="flex-1 gap-2 dark:text-white dark:border-gray-600"
              >
                <Usb className="w-4 h-4" /> USB
              </Button>
              <Button 
                onClick={() => handleConnect('bluetooth', 'scanner')} 
                disabled={!isBluetoothSupported || isConnecting}
                variant="outline"
                className="flex-1 gap-2 dark:text-white dark:border-gray-600"
              >
                <Bluetooth className="w-4 h-4" /> BT
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Printer className="w-4 h-4" /> Thermal Printer
            </h4>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleConnect('usb', 'printer')} 
                disabled={!isUSBSupported || isConnecting}
                variant="outline"
                className="flex-1 gap-2 dark:text-white dark:border-gray-600"
              >
                <Usb className="w-4 h-4" /> USB
              </Button>
              <Button 
                onClick={() => handleConnect('bluetooth', 'printer')} 
                disabled={!isBluetoothSupported || isConnecting}
                variant="outline"
                className="flex-1 gap-2 dark:text-white dark:border-gray-600"
              >
                <Bluetooth className="w-4 h-4" /> BT
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold dark:text-white">Connected Devices</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Currently active external hardware.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence>
              {connectedDevices.map((device) => (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${device.type === 'printer' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                      {device.type === 'printer' ? <Printer className="w-4 h-4" /> : <Scan className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium dark:text-white">{device.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 uppercase">
                        {device.connection === 'usb' ? <Usb className="w-3 h-3" /> : <Bluetooth className="w-3 h-3" />}
                        {device.connection}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => disconnectDevice(device.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>

            {connectedDevices.length === 0 && (
              <div className="text-center py-8">
                <Smartphone className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No external devices connected.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExternalDeviceManager;
