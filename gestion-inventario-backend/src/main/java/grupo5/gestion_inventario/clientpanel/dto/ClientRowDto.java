// src/main/java/grupo5/gestion_inventario/clientpanel/dto/ClientRowDto.java
package grupo5.gestion_inventario.clientpanel.dto;

import grupo5.gestion_inventario.model.Client;

public record ClientRowDto(
        Long   id,
        String name,
        String email,
        String telefono,
        String plan,
        String estado
) {
    /** Helper de mapeo desde entidad */
    public static ClientRowDto fromEntity(Client c) {
        return new ClientRowDto(
                c.getId(),
                c.getName(),
                c.getEmail(),
                c.getTelefono(),
                c.getPlan(),
                c.getEstado()
        );
    }
}
