# Microservices Project

This project contains a user service and MongoDB database, deployable both with Docker Compose and Kubernetes (Minikube).

## Docker Compose Deployment

1. Build and run the services:

   ```
   docker-compose up --build
   ```

2. Access the user service at `http://localhost:3000`

## Kubernetes (Minikube) Deployment

1. Start Minikube:

   ```
   minikube start
   ```

2. Build the user-service image:

   ```
   docker build -t user-service:latest ./user-service
   ```

3. Load the image into Minikube:

   ```
   minikube image load user-service:latest
   ```

4. Apply the Kubernetes configurations:

   ```
   kubectl apply -f mongodb-deployment.yaml
   kubectl apply -f user-service-deployment.yaml
   ```

5. Get the URL to access the service:

   ```
   minikube service user-service --url
   ```

6. Use this URL to access your service.

## Testing

Use Postman or curl to test the endpoints:

- POST /login
- GET /user
- POST /logout

Remember to include the JWT token in the Authorization header for protected routes.
