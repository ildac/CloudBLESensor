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

// SSID hardcoded because I keep forgot it :-)
var peripheralUuid = process.argv[2] || '26d6ee41059049ac975051e960ff2ca3';

noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    noble.startScanning();
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', function(peripheral) {
  if (peripheral.uuid === peripheralUuid) {
    noble.stopScanning();

    console.log('peripheral with UUID ' + peripheralUuid + ' found');
    var advertisement = peripheral.advertisement;

    var localName = advertisement.localName;
    var txPowerLevel = advertisement.txPowerLevel;
    var manufacturerData = advertisement.manufacturerData;
    var serviceData = advertisement.serviceData;
    var serviceUuids = advertisement.serviceUuids;

    if (localName) {
      console.log('  Local Name        = ' + localName);
    }

    if (txPowerLevel) {
      console.log('  TX Power Level    = ' + txPowerLevel);
    }

    if (manufacturerData) {
      console.log('  Manufacturer Data = ' + manufacturerData.toString('hex'));
    }

    if (serviceData) {
      console.log('  Service Data      = ' + serviceData);
    }

    if (localName) {
      console.log('  Service UUIDs     = ' + serviceUuids);
    }

    console.log();

    explore(peripheral);
  }
});

function explore(peripheral) {
  console.log('services and characteristics:');

  peripheral.on('disconnect', function() {
		console.log('disconnected...');
    process.exit(0);
  });

  peripheral.connect(function(error) {
	  peripheral.discoverServices(['FFE0'], function(error, services) {
    console.log('discovered service: ' + services[0].uuid);

    // discover notify characteristic (where we read tx from BLE device)
	    services[0].discoverCharacteristics(['FFE1'], function (error, characteristics) {
	      console.log('discovered characteristic: ', characteristics[0].uuid);
			  var txCharacteristic = characteristics[0];
				txCharacteristic.notify(true, function (error) {
						console.log("notification is on");
						txCharacteristic.on('read', function(data, isNotification) {
							console.log('isNotification: ', isNotification);
	          	console.log('reading data: ', data);
							console.log('reading data UInt8: ', data.readUInt8(0));

						});
				});
			});
	  });
	});

	// to keep the server running
	process.stdin.resume();

	// to close gently
	var triedToExit = false;

	function exitHandler(options, err) {
		if (peripheral && !triedToExit) {
			triedToExit = true;
			console.log('Disconnecting...');
			peripheral.disconnect(function(err) {
				console.log('Disconnected.');
				process.exit();
			});
		} else {
			process.exit();
		}
	}

	// catches ctrl+c event
	process.on('SIGINT', exitHandler.bind(null, {exit:true}));


};
