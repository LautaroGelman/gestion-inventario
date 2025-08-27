// backend/src/main/java/grupo5/gestion_inventario/clientpanel/dto/ProviderCreateRequest.java
package grupo5.gestion_inventario.clientpanel.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProviderCreateRequest {
    private String name;
    private String address;
}

