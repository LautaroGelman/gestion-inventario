package grupo5.gestion_inventario.repository;

import grupo5.gestion_inventario.model.ProviderBranch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProviderBranchRepository extends JpaRepository<ProviderBranch, Long> {

    List<ProviderBranch> findBySucursalId(Long sucursalId);

    boolean existsByProviderIdAndSucursalId(Long providerId, Long sucursalId);

    Optional<ProviderBranch> findByProviderIdAndSucursalId(Long providerId, Long sucursalId);

    void deleteByProviderIdAndSucursalId(Long providerId, Long sucursalId);

    // Nuevo: filtrar activos de una sucursal
    List<ProviderBranch> findBySucursalIdAndActiveTrue(Long sucursalId);
}
