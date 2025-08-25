// backend/src/main/java/grupo5/gestion_inventario/clientpanel/dto/SucursalDto.java
package grupo5.gestion_inventario.clientpanel.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

/** Respuesta plana de sucursal para el client-panel */
@Getter @Setter
@AllArgsConstructor
public class SucursalDto {
    private Long id;
    private String name;
    private String address;
    private boolean active;
}
