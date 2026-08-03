import React, { useState, useEffect } from 'react';
import { MapPin, X } from 'lucide-react';
import { Location } from '../types';
import {
  NIGERIAN_STATES,
  getCitiesByState,
  getAllCities,
} from '../data/nigerian-locations';

interface LocationFilterProps {
  onLocationChange?: (location: Location) => void;
  onDistanceChange?: (distance: number) => void;
  selectedLocation?: Location;
  selectedDistance?: number;
}

export function LocationFilter({
  onLocationChange,
  onDistanceChange,
  selectedLocation,
  selectedDistance = 50,
}: LocationFilterProps) {
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const states = NIGERIAN_STATES.map((s) => s.name);
  const cities = selectedState ? getCitiesByState(selectedState) : [];

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedCity('');
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    const cityData = cities.find((c) => c.name === city);
    if (cityData && onLocationChange) {
      onLocationChange({
        city: cityData.name,
        state: cityData.state,
        country: 'Nigeria',
        coordinates: {
          latitude: cityData.latitude,
          longitude: cityData.longitude,
        },
      });
    }
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSelectedState('');
    setSelectedCity('');
    setSearchTerm('');
  };

  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Location Filter</h3>
      </div>

      {/* State Selection */}
      <div>
        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
          State
        </label>
        <select
          id="state"
          name="state"
          value={selectedState}
          onChange={(e) => handleStateChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a state...</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      {/* City Selection */}
      {selectedState && (
        <div className="relative">
          <label htmlFor="citySearch" className="block text-sm font-medium text-gray-700 mb-2">
            City
          </label>
          <div className="relative">
            <input
              id="citySearch"
              name="city"
              type="text"
              placeholder="Search city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* City Dropdown */}
          {showDropdown && filteredCities.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {filteredCities.map((city) => (
                <button
                  key={city.name}
                  onClick={() => handleCityChange(city.name)}
                  className={`w-full text-left px-4 py-2 hover:bg-blue-50 ${
                    selectedCity === city.name ? 'bg-blue-100 font-semibold' : ''
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected City Display */}
      {selectedCity && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-gray-600">
            <strong>Selected:</strong> {selectedCity}, {selectedState}
          </p>
        </div>
      )}

      {/* Search Radius */}
      <div>
        <label htmlFor="searchRadius" className="block text-sm font-medium text-gray-700 mb-2">
          Search Radius: {selectedDistance}km
        </label>
        <input
          id="searchRadius"
          name="radius"
          type="range"
          min="1"
          max="100"
          value={selectedDistance}
          onChange={(e) => onDistanceChange?.(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1km</span>
          <span>100km</span>
        </div>
      </div>

      {/* Clear Button */}
      {selectedCity && (
        <button
          onClick={handleClear}
          className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
        >
          Clear Filter
        </button>
      )}
    </div>
  );
}
