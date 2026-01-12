import json
import numpy as np
import requests

from io import BytesIO
from PIL import Image as PImage
from urllib.parse import quote_plus as url_encode

GOOGLE_STREET_URL = "https://maps.googleapis.com/maps/api/streetview"
GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:searchNearby"
GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

def get_img(url):
  res = requests.get(url, timeout=10)
  res.raise_for_status()
  return PImage.open(BytesIO(res.content)).convert("RGB")

def get_streetview_image(key, *, address=None, lat=None, lon=None, w=640, h=640, fov=100, heading=None):
  loc = url_encode(address) if address else f"{lat},{lon}"
  heading_param = f"&heading={heading}" if heading else ""
  url = f"{GOOGLE_STREET_URL}?size={w}x{h}&location={loc}&fov={fov}{heading_param}&key={key}"

  return get_img(url)

def get_address(key, *, lat, lon):
  url = f"{GOOGLE_GEOCODE_URL}?latlng={lat},{lon}&key={key}"
  res = requests.get(url, timeout=10)
  res.raise_for_status()
  result = res.json()["results"][0]
  return result["formatted_address"]

def get_latlon(key, *, address):
  address = url_encode(address)
  url = f"{GOOGLE_GEOCODE_URL}?address={address}&key={key}"
  res = requests.get(url, timeout=10)
  res.raise_for_status()
  result = res.json()["results"][0]
  return result["geometry"]["location"]

def get_place_latlon(place):
  viewport = place["viewport"]
  lat = (viewport["low"]["latitude"] + viewport["high"]["latitude"]) / 2
  lon = (viewport["low"]["longitude"] + viewport["high"]["longitude"]) / 2
  return lat,lon

def get_heading(pointA, pointB):
  latA, lonA = np.radians(pointA[0]), np.radians(pointA[1])
  latB, lonB = np.radians(pointB[0]), np.radians(pointB[1])
  dlon = lonB - lonA
  y = np.sin(dlon) * np.cos(latB)
  x = np.cos(latA) * np.sin(latB) - np.sin(latA) * np.cos(latB) * np.cos(dlon)
  heading_rad = np.atan2(y, x)
  heading_deg = np.rad2deg(heading_rad)
  return (heading_deg + 360.0) % 360.0

def get_dist(pointA, pointB):
  latA, lonA = np.radians(pointA[0]), np.radians(pointA[1])
  latB, lonB = np.radians(pointB[0]), np.radians(pointB[1])
  dlat = latB - latA
  dlon = lonB - lonA
  a = np.sin(dlat / 2) ** 2 + np.cos(latA) * np.cos(latB) * np.sin(dlon / 2) ** 2
  c = np.atan2(a ** 0.5, (1 - a) ** 0.5)
  R = 6_371_000
  return R * c

def get_bus_station(key, *, lat, lon, radius=5):
  place_fields = [
    "id",
    "primaryType",
    "displayName",
    "formattedAddress",
    "shortFormattedAddress",
    "location",
    "viewport",
  ]

  body_data = {
    "includedTypes": ["bus_stop"],
    "maxResultCount": 1,
    "locationRestriction": {
      "circle": {
        "center": {
          "latitude": lat,
          "longitude": lon
        },
        "radius": radius
      }
    }
  }

  headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": key,
    "X-Goog-FieldMask": ",".join([f"places.{x}" for x in place_fields])
  }

  res = requests.post(GOOGLE_PLACES_URL, data=json.dumps(body_data), headers=headers, timeout=10)
  res.raise_for_status()

  return res.json()
