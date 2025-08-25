// backend/src/main/java/grupo5/gestion_inventario/clientpanel/dto/AuthResponse.java
package grupo5.gestion_inventario.clientpanel.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.Set;

/**
 * Respuesta de autenticación con token JWT y metadatos del usuario.
 * - sucursalId: null para PROPIETARIO o usuarios sin sucursal asignada.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {
    private String token;
    private Long clientId;
    private Long employeeId;
    private Long sucursalId;   // null para propietario / sin sucursal
    private Set<String> roles; // e.g. ["ROLE_CAJERO","ROLE_ADMINISTRADOR"]
}
