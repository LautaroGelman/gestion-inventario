package grupo5.gestion_inventario.clientpanel.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.Set;

/**
 * Respuesta de autenticación que contiene el token JWT
 * y metadatos del usuario autenticado.
 */
@Setter
@Getter
public class AuthResponse {
    // Getters y Setters
    private String token;
    private Long clientId;
    private Long employeeId;
    private Long sucursalId;   // ← NUEVO: sucursal activa (null para PROPIETARIO o SUPERPANEL)
    private Set<String> roles;

    // Constructor por defecto
    public AuthResponse() {}

    // Constructor de conveniencia
    public AuthResponse(String token, Long clientId, Long employeeId, Long sucursalId, Set<String> roles) {
        this.token = token;
        this.clientId = clientId;
        this.employeeId = employeeId;
        this.sucursalId = sucursalId;
        this.roles = roles;
    }

}
