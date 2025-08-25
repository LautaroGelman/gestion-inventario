// backend/src/main/java/grupo5/gestion_inventario/clientpanel/dto/SucursalRequest.java
package grupo5.gestion_inventario.clientpanel.dto;

import lombok.Getter;
import lombok.Setter;

/** Payload para crear/editar sucursales */
@Getter @Setter
public class SucursalRequest {
    private String name;       // opcional
    private String address;    // opcional
    private Boolean active;    // opcional — por defecto true al crear
}

