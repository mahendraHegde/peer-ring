docker build -f k3d/Dockerfile -t localhost:5000/kv-app .
docker push localhost:5000/kv-app:latest
kubectl delete deployment kv-app --ignore-not-found=true && kubectl apply -f ./k3d/deployment.yaml