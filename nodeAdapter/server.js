/*
	Cloud BLE Sensor
	Copyright (C) 2014  Marco Da Col

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

var noble = require('noble');
var connectedBean = null;

// on startup start scanning for BLE devices
noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    noble.startScanning();
    console.log('Scanning for BLE devices...');
  } else {
    noble.stopScanning();
    console.log('State changed to ' + '. Scanning stopped.');
  }
});

// when a device is discovered, noble connects to it
noble.on('discover', function(peripheral) {
  peripheral.connect(function(error) {
    console.log('connected to peripheral: ' + peripheral.uuid);
    peripheral.discoverServices(null, function(error, services) {
      console.log('discovered the following services:');
      for (var i in services) {
        console.log('  ' + i + ' uuid: ' + services[i].uuid);
      }
    });
  });
  connectedBean = peripheral;
});


// to keep the server running
process.stdin.resume();

// to close gently
var triedToExit = false;

function exitHandler(options, err) {
  if (connectedBean && !triedToExit) {
    triedToExit = true;
    console.log('Disconnecting...');
    connectedBean.disconnect(function(err) {
      console.log('Disconnected.');
      process.exit();
    });
  } else {
    process.exit();
  }
}

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));