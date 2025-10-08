import React, { useState, useRef, useEffect } from "react";
import "emoji-mart/css/emoji-mart.css";
import { Picker } from "emoji-mart";

const Icons = ({ setContent, content, theme }) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={pickerRef}
      className="emoji-picker-container"
      style={{
        position: "relative",
        display: "inline-block",
        zIndex: "10",
        filter: theme ? "invert(1)" : "invert(0)",
      }}
    >
      <span
        className="emoji-trigger"
        onClick={() => setShowPicker(!showPicker)}
        style={{
          cursor: "pointer",
          padding: "8px",
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background-color 0.3s ease",
          backgroundColor: showPicker ? "rgba(59, 130, 246, 0.1)" : "transparent",
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
        }}
        onMouseLeave={(e) => {
          if (!showPicker) {
            e.target.style.backgroundColor = "transparent";
          }
        }}
      >
        <span style={{ fontSize: "20px" }}>😏</span>
      </span>
      
      {showPicker && (
        <div
          className="emoji-picker-dropdown"
          style={{
            position: "absolute",
            top: "100%",
            right: "0",
            zIndex: "1000",
            marginTop: "8px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid rgba(0, 0, 0, 0.1)",
          }}
        >
          <Picker
            theme={theme ? "dark" : "light"}
            showSkinTones={true}
            showPreview={false}
            onSelect={(emoji) => {
              setContent(content + emoji.native);
              setShowPicker(false);
            }}
            i18n={{
              search: "Search",
              clear: "Clear",
              notfound: "No Emoji Found",
              skintext: "Choose your default skin tone",
              categories: {
                search: "Search Results",
                recent: "Frequently Used",
                smileys: "Smileys & Emotion",
                people: "People & Body",
                nature: "Animals & Nature",
                foods: "Food & Drink",
                activity: "Activity",
                places: "Travel & Places",
                objects: "Objects",
                symbols: "Symbols",
                flags: "Flags",
                custom: "Custom",
              },
              categorieslabel: "Emoji categories",
              skintones: {
                1: "Default Skin Tone",
                2: "Light Skin Tone",
                3: "Medium-Light Skin Tone",
                4: "Medium Skin Tone",
                5: "Medium-Dark Skin Tone",
                6: "Dark Skin Tone",
              },
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Icons;
