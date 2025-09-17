import jwt from "jsonwebtoken";
export function expressAuthentication(request, securityName, scopes) {
    if (securityName === "jwt") {
        const token = request.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            return Promise.reject(new Error("No token provided"));
        }
        return new Promise((resolve, reject) => {
            if (!process.env.JWT_SECRET) {
                reject(new Error("JWT_SECRET not configured"));
                return;
            }
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) {
                    reject(err);
                }
                else {
                    // Attach user to request
                    request.user = decoded;
                    resolve(decoded);
                }
            });
        });
    }
    return Promise.reject(new Error("Unknown security name"));
}
