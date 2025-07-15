package grupo5.gestion_inventario.clientpanel.dto;

import java.util.Set;

public class AuthResponse {
    private String token;
    private Long clientId;
    private Long employeeId;
    private Set<String> roles;

    // Constructor por defecto
    public AuthResponse() {}

    // Constructor de conveniencia
    public AuthResponse(String token, Long clientId, Long employeeId, Set<String> roles) {
        this.token = token;
        this.clientId = clientId;
        this.employeeId = employeeId;
        this.roles = roles;
    }

    // Getters y Setters
    public String getToken() {
        return token;
    }
    public void setToken(String token) {
        this.token = token;
    }

    public Long getClientId() {
        return clientId;
    }
    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public Long getEmployeeId() {
        return employeeId;
    }
    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public Set<String> getRoles() {
        return roles;
    }
    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }
}
