import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Polygon, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, Modal, Box, IconButton, Typography, TextField, Tooltip, MenuItem, ListItemText } from '@mui/material';
import { Cancel, Undo, Save, Add } from '@mui/icons-material';

const MapView = () => {
  const [lands, setLands] = useState([]);
  const [selectedLand, setSelectedLand] = useState(null);
  const [clickedPositions, setClickedPositions] = useState([]); // Store clicked positions for new land
  const [isCreatingLand, setIsCreatingLand] = useState(false); // Flag for creating new land
  const [showSaveModal, setShowSaveModal] = useState(false); // Modal to confirm saving land
  const [toolboxOpen, setToolboxOpen] = useState(false); // Toggle the toolbox
  const [newLandData, setNewLandData] = useState({
    name: '',
    imageUrl: '',
    price: '',
    type: '',
  });

  const [searchQuery, setSearchQuery] = useState('');  // Store search input
  const [mapCenter, setMapCenter] = useState([22.94275737438829, 89.18402516392086]);
  const [searchResults, setSearchResults] = useState([]);

  // Fetch existing lands from the server
  useEffect(() => {
    axios.get('/api/lands')
      .then(response => {
        setLands(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the lands!', error);
      });
  }, []);

    // Handle live search as the user types
    const handleSearchChange = (event) => {
      setSearchQuery(event.target.value);
      if (event.target.value.trim()) {
        fetchSearchResults(event.target.value);
      } else {
        setSearchResults([]);
      }
    };
  
    const fetchSearchResults = (query) => {
      if (query.length < 4) {
        return;
      }
      const searchUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?address=${encodeURIComponent(query)}&maxLocations=10&countryCode=BD&f=json`;
  
      axios.get(searchUrl)
        .then((response) => {
          const candidates = response.data.candidates;
          if (candidates && candidates.length > 0) {
            setSearchResults(candidates);
          } else {
            setSearchResults([]);
          }
        })
        .catch((error) => {
          console.error('Error performing geocode search', error);
          setSearchResults([]);
        });
    };
  
    // Set the map center based on selected candidate
    const handleSearchResultClick = (location) => {
      setMapCenter([location.y, location.x]);  // Update map center
      setSearchResults([]); // Clear search results after selection
    };
  

  const handleLandClick = (land) => {
    setSelectedLand(land);
  };

  const handleCloseModal = () => {
    setSelectedLand(null);
  };

  const handleStartLandCreation = () => {
    setIsCreatingLand(true);
    setClickedPositions([]); // Reset clicked positions
    setToolboxOpen(true);
  };

  // Clear the entire list of clicked positions
  const handleCancel = (event) => {
    setClickedPositions([]);
    setToolboxOpen(false);
  };

  // Revert the last clicked coordinate
  const handleRevert = (event) => {
    const sliced = clickedPositions.slice(0, -1);
    setClickedPositions(sliced);
  };

  // Handle modal input changes
  const handleInputChange = (e) => {
    setNewLandData({
      ...newLandData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle saving land (backend API call)
  const handleSaveLand = (event) => {
    const landData = {
      coordinates: clickedPositions,
      ...newLandData,
    };
    axios.post('/api/lands', landData)
      .then(response => {
        setLands([...lands, response.data]);
        setShowSaveModal(false);
        setClickedPositions([]); // Clear selections after save
        setToolboxOpen(false); // Close toolbox after saving
      })
      .catch(error => {
        console.error('Error saving land', error);
      });
  };

  const landTypeColor = (type) => {
    let colorOptions;
    switch (type) {
      case 'sell':
        colorOptions = { fillColor: 'blue' };
        break;
      case 'rent':
        colorOptions = { color: 'purple' };
        break;
      default:
        colorOptions = { color: 'red' }; // default color
    }
    return colorOptions;
  };

  // Component to capture clicks on the map
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const clickedElement = e?.originalEvent?.srcElement?.tagName;
        if (clickedElement === 'svg' || clickedElement === 'path') {
          return;
        }

        if (isCreatingLand) {
          const { lat, lng } = e.latlng;
          setClickedPositions([...clickedPositions, [lat, lng]]);
        }
      }
    });
    return null;
  };

  const MapCenterUpdater = ({ mapCenter }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(mapCenter, map.getZoom(), { animate: true });
    }, [map, mapCenter]);
    return null;
  };

  return (
    <>
      {/* Floating Search Box */}
      <Box className="searchBox">
        <TextField
          placeholder="Search Location"
          value={searchQuery}
          onChange={handleSearchChange}
          variant="outlined"
          sx={{ width: '100%' }}
          autoComplete="off"
        />

        {/* Dropdown for search suggestions */}
        {searchResults.length > 0 && (
          <Box sx={{ position: 'absolute', top: '60px', left: '50%', transform: 'translateX(-50%)', width: '300px', backgroundColor: 'white', zIndex: 1000, boxShadow: 2 }}>
            {searchResults.map((result, index) => (
              <MenuItem key={index} onClick={() => handleSearchResultClick(result.location)}>
                <ListItemText primary={result.address} />
              </MenuItem>
            ))}
          </Box>
        )}
      </Box>
      <MapContainer center={mapCenter} zoom={18} style={{ height: '95vh', width: '100%' }}>
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/en-us/home">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
          maxZoom={19}
          minZoom={3}
        />

        {/* Display existing lands */}
        {lands.map(land => (
          <Polygon
            key={land._id}
            pathOptions={landTypeColor(land.type)}
            positions={land.coordinates}
            eventHandlers={{ click: () => handleLandClick(land) }}
          />
        ))}

        {/* Display new land being created */}
        {clickedPositions.length > 0 && (
          <Polygon pathOptions={{ color: 'green' }} positions={clickedPositions} />
        )}

        <LocationMarker />
        <MapCenterUpdater mapCenter={mapCenter} />

        {/* Floating Toolbox/Button Tray */}
        <Box className="toolBox">
          {toolboxOpen ? (
            <>
              {/* Revert button with icon */}
              <Tooltip title="Undo">
                <span>
                  <IconButton
                    color="warning"
                    className="icon-button-style"
                    disabled={clickedPositions.length < 1} onClick={handleRevert}>
                    <Undo />
                  </IconButton>
                </span>
              </Tooltip>

              {/* Save Land button with icon */}
              <Tooltip title="Save">
                <span>
                  <IconButton className="icon-button-style" color="success" disabled={clickedPositions.length < 3} onClick={() => setShowSaveModal(true)}>
                    <Save />
                  </IconButton>
                </span>
              </Tooltip>

              {/* Cancel button */}
              <Tooltip title="Cancel">
                <span>
                  <IconButton className="icon-button-style" color="error" onClick={handleCancel}>
                    <Cancel />
                  </IconButton>
                </span>
              </Tooltip>
            </>) : (
            <Tooltip title="Add new">
              <span>
                <IconButton className="icon-button-style" color="primary" onClick={handleStartLandCreation}>
                  <Add />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>

        <Modal open={showSaveModal} onClose={() => setShowSaveModal(false)}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
            }}
          >
            <Typography variant="h6">Enter Land Details</Typography>
            <TextField
              label="Name"
              fullWidth
              margin="normal"
              name="name"
              value={newLandData.name}
              onChange={handleInputChange}
            />
            <TextField
              label="Image URL"
              fullWidth
              margin="normal"
              name="imageUrl"
              value={newLandData.imageUrl}
              onChange={handleInputChange}
            />
            <TextField
              label="Price"
              fullWidth
              margin="normal"
              name="price"
              value={newLandData.price}
              onChange={handleInputChange}
            />
            <TextField
              label="Type"
              fullWidth
              margin="normal"
              name="type"
              value={newLandData.type}
              onChange={handleInputChange}
            />

            <Button variant="contained" color="primary" onClick={handleSaveLand}>
              Save Land
            </Button>
          </Box>
        </Modal>

        {/* Modal to view land details */}
        <Modal open={!!selectedLand} onClose={handleCloseModal}>
          <Box sx={{ ...modalStyle }}>
            <Typography variant="h6" component="h2">{selectedLand?.name}</Typography>
            <img src={selectedLand?.imageUrl ?? '/images/place_holder.png'} alt={selectedLand?.name} style={{ maxWidth: '100%', maxHeight: '300px', marginBottom: '10px' }} />
            <Typography variant="body1">Price: ${selectedLand?.price}</Typography>
            <Typography variant="body2">{selectedLand?.description}</Typography>
            <Button onClick={handleCloseModal}>Close</Button>
          </Box>
        </Modal>
      </MapContainer>
    </>
  );
};

// Styles for the modal
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  width: 500,
};

export default MapView;
