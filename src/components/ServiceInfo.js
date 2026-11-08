
import React from "react";

function ServiceInfo({ label, value }) {
  return (
    <div className="detail-info">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default ServiceInfo;
