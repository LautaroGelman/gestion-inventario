// backend/src/main/java/grupo5/gestion_inventario/model/ProviderBranch.java
package grupo5.gestion_inventario.clientpanel.model;

import grupo5.gestion_inventario.model.Provider;
import grupo5.gestion_inventario.model.Sucursal;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "provider_branch",
        uniqueConstraints = @UniqueConstraint(columnNames = {"provider_id","sucursal_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProviderBranch {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="provider_id", nullable=false)
    private Provider provider;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="sucursal_id", nullable=false)
    private Sucursal sucursal;

    private boolean active = true;

    // overrides opcionales
    private String alias;
    private String deliveryAddress;
    private String terms;
    private String notes;
}
