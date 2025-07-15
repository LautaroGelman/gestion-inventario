package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.service.MonthClosureService;
import java.time.YearMonth;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/client-panel/{clientId}/finance/close-month")
@RequiredArgsConstructor
public class MonthClosureController {

    private final MonthClosureService closeSvc;

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void close(@PathVariable Long clientId,
                      @RequestParam int year,
                      @RequestParam int month) {
        closeSvc.closeMonth(clientId, YearMonth.of(year, month));
    }
}
