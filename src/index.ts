#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from "zod";
import axios from 'axios';

// Create an MCP server
const server = new McpServer({
  name: "Demo",
  version: "1.0.0"
});

class Weather {
  private server: Server;
  private axiosInstance: any;

  constructor() {
    console.error('[Setup] Initializing Weather server...');

    this.axiosInstance = axios.create({
      baseURL: 'https://api.open-meteo.com/v1/forecast', // Base URL without parameters
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    this.server = new Server(
      {
        name: 'weather-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.server.onerror = (error) => console.error('[Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }


  async getWeatherData(lat: string, lng: string) {
    try {
      const params = {
        latitude: lat,
        longitude: lng,
        current: 'temperature_2m,wind_speed_10m',
        hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m'
      };

      const response = await this.axiosInstance.get('', { params });
      return response.data;
    } catch (error: any) {
      console.error('[Error] Failed to fetch weather data:', error.message);
      return 'Error';
    }
  }

}

server.tool("getWeather",
  { lat: z.string(), lng: z.string() },
  async function({ lat, lng }) {
    const weatherInstance = new Weather();
    const weatherData = await weatherInstance.getWeatherData(lat, lng);

    return ({
      content: [{
        type: "text", text: JSON.stringify(weatherData, null, 2)
      }]
    });
  }
);

const run = async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run();


