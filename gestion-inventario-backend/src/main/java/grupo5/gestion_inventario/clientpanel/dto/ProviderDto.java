// backend/src/main/java/grupo5/gestion_inventario/clientpanel/dto/ProviderDto.java
package grupo5.gestion_inventario.clientpanel.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProviderDto {
    private Long id;
    private String name;
    private String address;
}
