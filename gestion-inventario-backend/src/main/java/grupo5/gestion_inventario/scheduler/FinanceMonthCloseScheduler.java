// src/main/java/grupo5/gestion_inventario/scheduler/FinanceMonthCloseScheduler.java
package grupo5.gestion_inventario.scheduler;

import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.service.MonthClosureService;
import java.time.YearMonth;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FinanceMonthCloseScheduler {

    private final MonthClosureService closeSvc;
    private final ClientRepository clientRepo;

    /** Cierra el mes anterior cada 1° a las 00:05 hora Mendoza */
    @Scheduled(cron = "0 5 0 1 * *", zone = "America/Argentina/Mendoza")
    public void autoClose() {
        YearMonth prev = YearMonth.now().minusMonths(1);
        clientRepo.findAll()
                .stream()
                .map(Client::getId)
                .forEach(id -> closeSvc.closeMonth(id, prev));
    }
}
