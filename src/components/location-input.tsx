"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

interface LocationInputProps {
  value: string;
  onLocationSelect: (value: string) => void;
}

const LocationInput: React.FC<LocationInputProps> = ({ value, onLocationSelect }) => {
  const [inputValue, setInputValue] = React.useState(value);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Effect to clear the input if the parent's value is cleared
  React.useEffect(() => {
    if (value === "") {
        setInputValue("");
    }
  }, [value]);

  // Effect for fetching suggestions with debouncing
  React.useEffect(() => {
    if (inputValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/properties/search?query=${inputValue}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
      }
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    // Do not call onLocationSelect here to ensure only a valid selection is propagated
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    onLocationSelect(suggestion); // Update parent component's state with the selected value
    setShowSuggestions(false);
  };

  return (
    <div className="relative col-span-1 md:col-span-1">
      <Input
        type="text"
        placeholder="Commune ou quartier"
        className="text-black"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // Hide on blur with delay
        onFocus={() => inputValue.length > 1 && suggestions.length > 0 && setShowSuggestions(true)}
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto text-black shadow-lg">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onMouseDown={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationInput;
