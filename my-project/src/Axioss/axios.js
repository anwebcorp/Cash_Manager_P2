/* eslint-disable react-refresh/only-export-components */
import axios from "axios";
const BASE_URL = 'http://127.0.0.1:8000';

// Only export the default axios instance for public requests
export default axios.create({
    baseURL: BASE_URL
});