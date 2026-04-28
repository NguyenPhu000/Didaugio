import legacyRoutingService from "../../services/routing/routing.service.js";

class RoutingDomainService {
  async calculate(payload = {}) {
    return legacyRoutingService.calculate(payload);
  }

  async calculateLegs(payload = {}) {
    return legacyRoutingService.calculateLegs(payload);
  }

  async getHealth() {
    return legacyRoutingService.getHealth();
  }
}

export default new RoutingDomainService();
