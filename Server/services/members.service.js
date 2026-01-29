// services/memberService.js
export const exportMembersCSV = async () => {
  try {
    const response = await fetch("/api/members/export", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "members.csv"); // filename
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  } catch (err) {
    console.error("Export failed:", err);
    alert("CSV export failed.");
  }
};
