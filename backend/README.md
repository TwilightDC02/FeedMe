# FeedMeAi Backend Documentation

## Overview
FeedMeAi is a web application that compiles credit card promotions and dining offers from various platforms, providing users with a dashboard to visualize their orders and savings. The application features a subscription model for premium features.

## Project Structure
The backend of the FeedMeAi application is structured as follows:

```
backend
├── src
│   ├── server.js          # Entry point of the backend application
│   ├── controllers         # Contains business logic for routes
│   │   └── index.js
│   ├── routes              # Defines API routes
│   │   └── index.js
│   └── models              # Data models for the application
│       └── index.js
├── package.json            # Backend dependencies and scripts
└── README.md               # Documentation for the backend
```

## Setup Instructions

1. **Clone the repository**
   ```
   git clone <repository-url>
   cd FeedMeAi/backend
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Run the server**
   ```
   npm start
   ```
   The server will start on port 5000 or the port specified in the environment variable `PORT`.

## API Usage

### Endpoints

- **GET /**: Returns a welcome message.
  
### Controllers
The controllers handle the business logic for various routes, such as fetching promotions and user data. They are located in the `src/controllers` directory.

### Models
Data models, including user and promotion schemas, are defined in the `src/models` directory and are used throughout the application.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.