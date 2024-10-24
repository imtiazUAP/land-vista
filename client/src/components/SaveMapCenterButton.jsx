import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { GpsFixed } from "@mui/icons-material";
import { toast } from 'react-toastify';

const SaveMapCenterButton = ({ mapCenter, currentMapZoom, activeBaseLayer }) => {
  const handleMapCenterSave = async (mapCenter, currentMapZoom, activeBaseLayer) => {
    // Step 1: Check browser storage for user_id
    const websiteData = JSON.parse(localStorage.getItem("landVistaData")) || {};
    let userId = websiteData.user_id;

    // Step 2: If user_id not found, create a new user
    if (!userId) {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/users/create`,
        { method: 'POST' });
      const data = await response.json();
      websiteData.user_id = data.user_id;
    } else {
      websiteData.user_id = userId;
    }
    websiteData.map_center = mapCenter;
    websiteData.map_zoom = currentMapZoom;
    websiteData.activeBaseLayer = activeBaseLayer;
    localStorage.setItem("landVistaData", JSON.stringify(websiteData));
    toast.success('Saved map center.');
  };
  return (
    <Box className="saveMapCenterButton">
      <Tooltip title="Mark this as my map center" placement="left">
        <span>
          <IconButton
            className="icon-button-style"
            color="primary"
            onClick={() => handleMapCenterSave(mapCenter, currentMapZoom, activeBaseLayer)}
          >
            <GpsFixed />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};

export default SaveMapCenterButton;
