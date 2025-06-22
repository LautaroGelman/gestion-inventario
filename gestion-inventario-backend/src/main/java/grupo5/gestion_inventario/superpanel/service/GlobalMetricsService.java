package grupo5.gestion_inventario.superpanel.service;

import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.clientpanel.repository.SaleRepository;
import grupo5.gestion_inventario.superpanel.dto.GlobalMetricsDTO;
import grupo5.gestion_inventario.superpanel.repository.CustomerAccountRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class GlobalMetricsService {

    private final ClientRepository clientRepo;
    private final SaleRepository saleRepo;
    private final CustomerAccountRepository accountRepo;

    public GlobalMetricsService(ClientRepository clientRepo,
                                SaleRepository saleRepo,
                                CustomerAccountRepository accountRepo) {
        this.clientRepo  = clientRepo;
        this.saleRepo    = saleRepo;
        this.accountRepo = accountRepo;
    }

    public GlobalMetricsDTO getGlobalMetrics() {
        // Usa la tabla 'client' para contar cuentas y planes
        long totalAccounts       = clientRepo.count();
        long freeTrialAccounts   = clientRepo.countByPlan("BASICO");
        long standardAccounts    = clientRepo.countByPlan("INTERMEDIO");
        long premiumAccounts     = clientRepo.countByPlan("PREMIUM");

        // Ingresos últimos 30 días
        BigDecimal totalRevenueLast30d =
                saleRepo.totalRevenueSince(LocalDateTime.now().minusDays(30));

        // Productos y alertas (sigue usando las queries de CustomerAccountRepository)
        long totalProducts     = accountRepo.countAllProducts();
        long lowStockAlerts    = accountRepo.countLowStock();

        return new GlobalMetricsDTO(
                totalAccounts,
                freeTrialAccounts,
                standardAccounts,
                premiumAccounts,
                totalRevenueLast30d,
                totalProducts,
                lowStockAlerts
        );
    }
}
