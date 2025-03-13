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

  async getWeatherData(lat: number, lng: number) {
    try {
      this.axiosInstance = axios.create({
        baseURL: `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}¤t=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`,
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      const response = await this.axiosInstance.get('');
      return response.data;
    } catch (error: any) {
      console.error('[Error] Failed to fetch weather data:', error.message);
      throw error; // Re-throw to allow calling function to handle the error
    }
  }
}


server.tool("getWeather",
  { lat: z.number(), lng: z.number() },
  async function({ lat, lng }) {


    const weatherInstance = new Weather();
    const weatherData = await weatherInstance.getWeatherData(lat, lng);

    return ({
      content: [{
        type: "text", text: String(weatherData)
      }]
    });
  }
);

const run = async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run();

