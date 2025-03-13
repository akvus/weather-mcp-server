#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const zod_1 = require("zod");
const axios_1 = __importDefault(require("axios"));
// Create an MCP server
const server = new mcp_js_1.McpServer({
    name: "Demo",
    version: "1.0.0"
});
class Weather {
    server;
    axiosInstance;
    constructor() {
        console.error('[Setup] Initializing Weather server...');
        this.axiosInstance = axios_1.default.create({
            baseURL: 'https://api.open-meteo.com/v1/forecast', // Base URL without parameters
            timeout: 5000,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        this.server = new index_js_1.Server({
            name: 'weather-server',
            version: '0.1.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.server.onerror = (error) => console.error('[Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    async getWeatherData(lat, lng) {
        try {
            const params = {
                latitude: lat,
                longitude: lng,
                current: 'temperature_2m,wind_speed_10m',
                hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m'
            };
            const response = await this.axiosInstance.get('', { params });
            return response.data;
        }
        catch (error) {
            console.error('[Error] Failed to fetch weather data:', error.message);
            return 'Error';
        }
    }
}
server.tool("getWeather", { lat: zod_1.z.string(), lng: zod_1.z.string() }, async function ({ lat, lng }) {
    const weatherInstance = new Weather();
    const weatherData = await weatherInstance.getWeatherData(lat, lng);
    return ({
        content: [{
                type: "text", text: JSON.stringify(weatherData, null, 2)
            }]
    });
});
const run = async () => {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
};
run();
